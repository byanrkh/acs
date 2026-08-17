"use server";

import { after } from "next/server";
import { supabaseAdmin } from "@/libs/supabase/server";
import { submitTransferRegistration } from "@/libs/actions/registrationTransfer";
import { createPaymentTransaction } from "@/libs/actions/checkout";
import { getRegistrationFee } from "@/libs/config/pricing";
import { CONFIRMED_REGISTRATION_QUOTA } from "@/libs/config/capacity";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildInvoiceEmailHtml } from "@/libs/email/invoiceTemplate";
import { buildTransferInvoiceEmailHtml } from "@/libs/email/transferInvoiceTemplate";

export type RegistrationPayload = {
  kategori: "pelajar" | "umum";
  nisn?: string;
  nikTerakhir?: string;
  namaLengkap: string;
  email: string;
  telepon: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  golonganDarah: string;
  riwayatPenyakit?: string;
  kontakDaruratNama: string;
  kontakDaruratTelepon: string;
  ukuranJersey: string;
  namaBib: string;
};

export type RegistrationResult =
  | { ok: true; registrationId: string; redirectPath?: string }
  | { ok: false; error: string; field?: keyof RegistrationPayload };

// Email/NISN/nomor HP sengaja TIDAK dijadikan UNIQUE constraint di database
// (satu email/nomor HP boleh dipakai lebih dari sekali, misal orang tua
// daftarin lebih dari satu anak). Tapi itu bukan berarti tidak ada
// pencegahan duplikat sama sekali -- lihat findDuplicateRegistration() di
// bawah, yang mencegah SATU PESERTA YANG SAMA (dikenali dari kategori +
// NISN/NIK + nama lengkap) kebentuk jadi lebih dari satu baris registration
// yang masih aktif (belum lunas / sedang diverifikasi / sudah confirmed).
function validatePayload(data: RegistrationPayload): RegistrationResult | null {
  if (!data.namaLengkap?.trim()) {
    return { ok: false, error: "Nama lengkap wajib diisi.", field: "namaLengkap" };
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email ?? "")) {
    return { ok: false, error: "Format email tidak valid.", field: "email" };
  }
  if (data.kategori === "pelajar" && !/^\d{10}$/.test(data.nisn ?? "")) {
    return { ok: false, error: "NISN wajib 10 digit angka.", field: "nisn" };
  }
  if (data.kategori === "umum" && !/^\d{16}$/.test(data.nikTerakhir ?? "")) {
    return { ok: false, error: "NIK tidak valid, wajib 16 digit angka.", field: "nikTerakhir" };
  }
  if ((data.namaBib ?? "").length > 12) {
    return { ok: false, error: "Nama di BIB maksimal 12 karakter.", field: "namaBib" };
  }
  return null;
}

// ============================================================
// DUPLICATE PREVENTION
// ============================================================
// Identifier utama = NISN (kategori pelajar) atau NIK lengkap (umum).
// (kategori umum) -- keduanya berfungsi sebagai "identifier" yang sama,
// cuma beda kolom tergantung kategori. Sekarang nik_terakhir menyimpan NIK
// (rawan tabrakan/kebetulan sama), kita WAJIB tambahin nama lengkap sebagai
// pembanding kedua supaya nggak salah nganggep dua orang beda jadi orang
// yang sama.
//
// Status yang dianggap "masih relevan" untuk dicek (bukan slot kosong):
// pending_payment, waiting_verification, dan confirmed. Baris dengan status
// "cancelled" TIDAK dihitung sebagai duplikat (sudah dibatalkan, dianggap
// slot kosong -- user boleh daftar ulang dari nol).
//
// PENTING: "expired" SENGAJA TIDAK dimasukkan ke sini. Begitu sebuah
// registration berstatus expired (waktu bayar 3 jam sudah lewat, lihat
// PAYMENT_DURATION_HOURS di libs/actions/checkout.ts), NISN/NIK yang dipakai
// di registration itu dianggap "bebas" lagi -- peserta boleh isi form dari
// awal pakai NISN/NIK yang sama, dan itu akan membuat baris registration
// BARU (bukan diarahkan balik ke checkout lama yang sudah expired). Data
// registration lama yang expired tetap tersimpan apa adanya di database,
// cuma sudah tidak dianggap "aktif" lagi untuk keperluan pengecekan ini.
const ACTIVE_STATUSES_FOR_DUPLICATE_CHECK = [
  "pending_payment",
  "waiting_verification",
  "confirmed",
];

// Urutan prioritas kalau (secara teori) ada lebih dari satu baris aktif
// yang cocok -- ambil yang paling "final" duluan, supaya user diarahkan ke
// registration yang paling relevan/terbaru statusnya.
const DUPLICATE_STATUS_PRIORITY = [
  "confirmed",
  "waiting_verification",
  "pending_payment",
];

type DuplicateRegistrationMatch = {
  id: string;
  status: string;
  nomor_urut: number | null;
};

type DuplicateCheckResult =
  | { ok: true; match: DuplicateRegistrationMatch | null }
  | { ok: false; error: string };

async function findDuplicateRegistration(
  kategori: "pelajar" | "umum",
  identifierValue: string,
): Promise<DuplicateCheckResult> {
  // Kolom identifier beda tergantung kategori -- pelajar pakai NISN, umum
  // pakai NIK lengkap (16 digit). Keduanya diperlakukan sebagai "identifier
  // utama" yang sama secara konsep, cuma beda kolom penyimpanan.
  //
  // CATATAN: sengaja HANYA cocokkan kategori + NISN/NIK -- tidak dibandingkan
  // lagi dengan nama/email/dll. Begitu NISN/NIK sama, langsung dianggap
  // peserta yang sama, apa pun data lain yang diisi berbeda (email, nomor
  // HP, bahkan nama sekalipun -- itu dianggap koreksi data, bukan peserta
  // baru).
  const identifierColumn = kategori === "pelajar" ? "nisn" : "nik_terakhir";

  const { data: candidates, error } = await supabaseAdmin
    .from("registrations")
    .select("id, status, nomor_urut, payment_expires_at")
    .eq("kategori", kategori)
    .eq(identifierColumn, identifierValue)
    .in("status", ACTIVE_STATUSES_FOR_DUPLICATE_CHECK);

  if (error) {
    console.error("[findDuplicateRegistration] gagal cek data duplikat:", error);
    return {
      ok: false,
      error: "Gagal memeriksa data pendaftaran, coba lagi.",
    };
  }

  if (!candidates || candidates.length === 0) {
    return { ok: true, match: null };
  }

  // Lazy-expire: kandidat berstatus "pending_payment" yang batas waktu
  // bayarnya (payment_expires_at) sudah lewat TAPI status di database belum
  // sempat berubah jadi "expired" (biasanya cron expire-pending-registrations
  // di Supabase sudah menangani ini duluan, tapi tetap dicek ulang di sini
  // sebagai jaga-jaga). Tanpa ini, peserta yang belum bayar > 3 jam dan
  // LANGSUNG isi form lagi akan tetap ke-block, padahal seharusnya
  // NISN/NIK-nya sudah bebas dipakai lagi. Jadi di sini kita expire-kan
  // dulu baris lama tsb, lalu keluarkan dari daftar kandidat "aktif".
  const stillActiveCandidates: typeof candidates = [];
  for (const candidate of candidates) {
    const isPastDeadline =
      candidate.status === "pending_payment" &&
      candidate.payment_expires_at &&
      new Date(candidate.payment_expires_at as string).getTime() < Date.now();

    if (isPastDeadline) {
      await supabaseAdmin
        .from("registrations")
        .update({ status: "expired" })
        .eq("id", candidate.id);
      continue;
    }

    stillActiveCandidates.push(candidate);
  }

  if (stillActiveCandidates.length === 0) {
    return { ok: true, match: null };
  }

  const sorted = [...stillActiveCandidates].sort(
    (a, b) =>
      DUPLICATE_STATUS_PRIORITY.indexOf(a.status) -
      DUPLICATE_STATUS_PRIORITY.indexOf(b.status),
  );

  const best = sorted[0];
  return {
    ok: true,
    match: {
      id: best.id,
      status: best.status,
      nomor_urut: best.nomor_urut as number | null,
    },
  };
}

// registration.nomor_urut cuma pernah diisi lewat submitTransferRegistration
// (channel BANK_TRANSFER) -- Midtrans TIDAK PERNAH mengisi kolom ini. Jadi
// nomor_urut !== null adalah cara aman buat tahu registration lama itu
// dulunya dibuat lewat channel transfer atau Midtrans, TANPA perlu nebak
// dari NEXT_PUBLIC_PAYMENT_METHOD yang sekarang (yang bisa saja sudah
// berubah dari waktu registration lama itu dibuat).
// `?resumed=1` cuma penanda UI (dibaca CheckoutClient/TransferCheckoutClient
// buat nampilin banner "kamu diarahkan ke pendaftaran sebelumnya"), bukan
// data sensitif -- aman ada di query string dan langsung dibuang dari URL
// begitu banner-nya ditampilkan.
function buildCheckoutRedirectPath(match: DuplicateRegistrationMatch): string {
  return match.nomor_urut !== null
    ? `/checkout/transfer/${match.id}?resumed=1`
    : `/checkout/${match.id}?resumed=1`;
}

// ============================================================
// KUOTA PENDAFTARAN
// ============================================================
// Dihitung dari status "confirmed" doang (sudah lunas), BUKAN dari total
// baris registrations -- baris pending_payment/expired yang gagal/nggak
// pernah dibayar tidak boleh ikut menutup kuota. Dipakai di dua tempat:
// 1. Di sini (submitRegistration) sebagai penjaga sisi server yang tidak
//    bisa di-bypass, karena halaman /registration statis bisa saja masih
//    ke-cache/ke-render sebelum kuota penuh.
// 2. Di app/(root)/registration/page.tsx buat nampilin pesan "pendaftaran
//    ditutup" ke user, gantiin form-nya, biar user nggak isi form sia-sia.
export async function getConfirmedRegistrationCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");

  if (error) {
    console.error("[getConfirmedRegistrationCount] gagal hitung kuota:", error);
    // Fail-open: kalau query kuota gagal, jangan sampai nge-block semua
    // pendaftaran cuma gara-gara error jaringan/DB sesaat.
    return 0;
  }

  return count ?? 0;
}

export async function isRegistrationClosed(): Promise<boolean> {
  const confirmedCount = await getConfirmedRegistrationCount();
  return confirmedCount >= CONFIRMED_REGISTRATION_QUOTA;
}

export async function submitRegistration(
  data: RegistrationPayload
): Promise<RegistrationResult> {
  const validationError = validatePayload(data);
  if (validationError) return validationError;

  const email = data.email.trim().toLowerCase();

  // ── CEK DUPLIKAT DULU, sebelum bercabang ke channel Midtrans/transfer.
  // Ini jalan untuk KEDUA channel pembayaran, karena baik registration.ts
  // maupun registrationTransfer.ts sama-sama insert ke tabel `registrations`
  // yang sama.
  const identifierValue =
    data.kategori === "pelajar"
      ? (data.nisn ?? "").trim()
      : (data.nikTerakhir ?? "").trim();

  const duplicateCheck = await findDuplicateRegistration(
    data.kategori,
    identifierValue,
  );

  if (!duplicateCheck.ok) {
    return { ok: false, error: duplicateCheck.error };
  }

  if (duplicateCheck.match) {
    // Ditemukan registration lama yang masih aktif untuk peserta yang sama.
    // JANGAN buat baris baru -- langsung arahkan ke checkout registration
    // lama. Halaman checkout ([id]/page.tsx dan transfer/[id]/page.tsx)
    // sudah otomatis menampilkan tampilan yang sesuai untuk tiap status:
    // - pending_payment           -> form bayar (lanjutkan pembayaran)
    // - waiting_verification      -> "Bukti transfer diterima, menunggu verifikasi"
    // - confirmed                 -> "Pembayaran terkonfirmasi" + BIB
    // jadi tidak perlu bikin state/pesan baru lagi di sini. ("expired"
    // tidak mungkin nyampe sini -- sudah difilter keluar sebagai kandidat
    // duplikat di findDuplicateRegistration di atas.)
    return {
      ok: true,
      registrationId: duplicateCheck.match.id,
      redirectPath: buildCheckoutRedirectPath(duplicateCheck.match),
    };
  }

  // Cek kuota SETELAH duplicate check lolos -- kalau ternyata ini peserta
  // lama yang mau lanjut checkout registration-nya sendiri (redirectPath di
  // atas), dia tidak boleh ikut diblokir cuma karena kuota sekarang sudah
  // penuh. Yang diblokir di sini murni baris baru/peserta baru saja.
  if (await isRegistrationClosed()) {
    return {
      ok: false,
      error: "Pendaftaran sudah ditutup karena kuota peserta sudah penuh.",
    };
  }

  const paymentMethod = process.env.NEXT_PUBLIC_PAYMENT_METHOD ?? "MIDTRANS";
  if (paymentMethod === "BANK_TRANSFER") {
    return submitTransferRegistration(data, email);
  }

  // PROMO: baseline final_amount = tarif dasar (belum ada diskon).
  // Promo baru diterapkan nanti di halaman /checkout/[id] lewat
  // applyPromoToRegistration, yang akan meng-update kolom ini.
  const baseAmount = getRegistrationFee(data.kategori);

  // Simpan ke database dan ambil 'id' (UUID) baris baru. Duplicate untuk
  // peserta yang sama sudah dicegah di atas -- insert di sini cuma
  // kejadian kalau memang belum pernah ada registration aktif yang cocok.
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("registrations")
    .insert({
      kategori: data.kategori,
      nisn: data.kategori === "pelajar" ? data.nisn : null,
      nik_terakhir: data.kategori === "umum" ? data.nikTerakhir : null,
      nama_lengkap: data.namaLengkap.trim(),
      email,
      telepon: data.telepon.trim(),
      tempat_lahir: data.tempatLahir.trim(),
      tanggal_lahir: data.tanggalLahir,
      jenis_kelamin: data.jenisKelamin,
      golongan_darah: data.golonganDarah,
      riwayat_penyakit: data.riwayatPenyakit?.trim() || null,
      kontak_darurat_nama: data.kontakDaruratNama.trim(),
      kontak_darurat_telepon: data.kontakDaruratTelepon.trim(),
      ukuran_jersey: data.ukuranJersey,
      nama_bib: data.namaBib.trim(),
      status: "pending_payment",
      promo_id: null,
      discount_amount: 0,
      final_amount: baseAmount,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      // Kalau ini masih ke-trigger, artinya masih ada UNIQUE constraint di
      // level database (kolom email/nisn/telepon) yang belum dilepas.
      // Cek/lepas constraint-nya langsung di Supabase (Table Editor ->
      // registrations -> kolom terkait -> hapus "Unique" constraint),
      // karena ini bukan lagi dicegah dari sisi kode.
      return {
        ok: false,
        error:
          "Data ini masih dianggap duplikat oleh database. Cek constraint UNIQUE di tabel registrations (kolom email/nisn/telepon) di Supabase.",
      };
    }
    console.error("Gagal simpan registrasi:", insertError);
    return { ok: false, error: "Gagal menyimpan data, coba lagi." };
  }

  const registrationId = inserted.id as string;

  // Langsung bikin transaksi Midtrans + kirim invoice PERTAMA di sini,
  // supaya user dapet email invoice segera setelah submit -- ga perlu
  // nunggu klik "Bayar Sekarang" dulu di /checkout/[id]. Dijalankan di
  // after() (Next.js) biar ga nge-block response submit (createPaymentTransaction
  // manggil Midtrans + Resend, dua-duanya network call). Fungsi ini sendiri
  // best-effort & idempotent soal invoice (guard invoice_email_sent_at),
  // jadi kalau nanti user klik "Bayar Sekarang" beneran, dia cuma bikin
  // transaksi baru (fresh token) tanpa kirim ulang invoice.
  after(async () => {
    const result = await createPaymentTransaction(registrationId);
    if (!result.ok) {
      console.error(
        "[submitRegistration] gagal membuat transaksi awal & kirim invoice:",
        result.error,
      );
    }
  });

  return { ok: true, registrationId };
}

// ============================================================
// EDIT DATA PESERTA DI CHECKOUT
// ============================================================
// Sengaja TIDAK termasuk `kategori`, `nisn`, `nikTerakhir` -- ini identifier
// utama untuk duplicate prevention dan harga, jadi tidak boleh diedit lewat
// jalur ini sama sekali. Karena field-field itu tidak ada di type ini,
// server action di bawah SECARA STRUKTURAL tidak mungkin menerima/mengubah
// nilainya walau request dimodifikasi manual dari browser.
export type EditRegistrationPayload = {
  namaLengkap: string;
  email: string;
  telepon: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  golonganDarah: string;
  riwayatPenyakit?: string;
  kontakDaruratNama: string;
  kontakDaruratTelepon: string;
  ukuranJersey: string;
  namaBib: string;
};

export type UpdateRegistrationResult =
  | {
    ok: true;
    registration: {
      namaLengkap: string;
      email: string;
      telepon: string;
      ukuranJersey: string;
    };
  }
  | { ok: false; error: string; field?: keyof EditRegistrationPayload };

// Status yang masih boleh diedit datanya. "expired" SENGAJA dikeluarkan --
// checkout yang sudah kedaluwarsa adalah jalan buntu (lihat CheckoutClient.tsx:
// canEditPromo/canEditParticipantData sekarang cuma true untuk
// pending_payment), jadi tidak ada lagi gunanya edit data di baris yang
// sudah tidak bisa dibayar. waiting_verification/confirmed/cancelled tetap
// dikunci karena data pesertanya sudah/sedang diproses panitia (bukti
// transfer, BIB, invoice, dll) -- mengubahnya di titik ini berisiko bikin
// data yang sudah diverifikasi nggak sinkron lagi.
const EDITABLE_STATUSES = new Set(["pending_payment"]);

function validateEditPayload(
  data: EditRegistrationPayload,
): UpdateRegistrationResult | null {
  if (!data.namaLengkap?.trim()) {
    return { ok: false, error: "Nama lengkap wajib diisi.", field: "namaLengkap" };
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email ?? "")) {
    return { ok: false, error: "Format email tidak valid.", field: "email" };
  }
  if (!/^0\d{9,13}$/.test(data.telepon ?? "")) {
    return { ok: false, error: "Nomor telepon tidak valid.", field: "telepon" };
  }
  if (!data.tempatLahir?.trim()) {
    return { ok: false, error: "Tempat lahir wajib diisi.", field: "tempatLahir" };
  }
  if (!data.tanggalLahir) {
    return { ok: false, error: "Tanggal lahir wajib diisi.", field: "tanggalLahir" };
  }
  if (data.jenisKelamin !== "L" && data.jenisKelamin !== "P") {
    return { ok: false, error: "Pilih jenis kelamin.", field: "jenisKelamin" };
  }
  if (!data.golonganDarah) {
    return { ok: false, error: "Pilih golongan darah.", field: "golonganDarah" };
  }
  if (!data.kontakDaruratNama?.trim()) {
    return {
      ok: false,
      error: "Nama kontak darurat wajib diisi.",
      field: "kontakDaruratNama",
    };
  }
  if (!/^0\d{9,13}$/.test(data.kontakDaruratTelepon ?? "")) {
    return {
      ok: false,
      error: "Nomor telepon kontak darurat tidak valid.",
      field: "kontakDaruratTelepon",
    };
  }
  if (!data.ukuranJersey) {
    return { ok: false, error: "Pilih ukuran jersey.", field: "ukuranJersey" };
  }
  if (!data.namaBib?.trim()) {
    return { ok: false, error: "Nama di BIB wajib diisi.", field: "namaBib" };
  }
  if (data.namaBib.trim().length > 12) {
    return { ok: false, error: "Nama di BIB maksimal 12 karakter.", field: "namaBib" };
  }
  return null;
}

// Kirim ulang email invoice transfer bank ke email TERBARU setelah user edit
// data di checkout. Semua data yang dibutuhkan (nominal, nomor urut, link
// checkout) sudah tersimpan di baris registration itu sendiri -- tidak perlu
// panggil API eksternal apa pun, jadi aman dilakukan kapan saja selama masih
// channel transfer. Best-effort: gagal kirim TIDAK boleh membuat edit data
// dianggap gagal (data sudah kepencet tersimpan duluan).
async function resendTransferInvoiceIfPossible(
  registration: {
    id: string;
    nama_lengkap: string;
    kategori: "pelajar" | "umum";
    ukuran_jersey: string;
    nomor_urut: number | null;
    final_amount: number;
  },
  toEmail: string,
) {
  try {
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/transfer/${registration.id}`;
    const grossAmount = registration.final_amount + (registration.nomor_urut ?? 0);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject: `Invoice diperbarui — ACS 2026 (${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(grossAmount)})`,
      html: buildTransferInvoiceEmailHtml({
        namaLengkap: registration.nama_lengkap,
        kategori: registration.kategori,
        ukuranJersey: registration.ukuran_jersey,
        grossAmount,
        checkoutUrl,
      }),
    });
  } catch (emailError) {
    console.error(
      "[resendTransferInvoiceIfPossible] gagal kirim ulang invoice:",
      emailError,
    );
  }
}

// Sama seperti di atas tapi untuk channel Midtrans. Cuma bisa "kirim ULANG"
// kalau invoice yang PERTAMA sudah pernah terkirim sebelumnya -- itu artinya
// user sudah pernah klik "Bayar Sekarang" sehingga order_id-nya sudah ada di
// database. Kalau belum pernah (order_id masih kosong), tidak ada apa-apa
// untuk dikirim ulang -- dibiarkan saja, nanti invoice PERTAMA otomatis
// terkirim ke email terbaru begitu mereka klik bayar (createPaymentTransaction
// selalu pakai registration.email yang paling baru dari database).
//
// PENTING: `paymentUrl` di email SELALU halaman checkout KITA
// (/checkout/[id]), BUKAN link hosted-page Midtrans (midtrans_redirect_url).
// Checkout kita yang jadi satu-satunya pintu bayar -- begitu status
// registrasi ini nanti expired, halaman itu sendiri yang otomatis menolak
// & mengarahkan ke pendaftaran ulang (lihat CheckoutClient.tsx), sesuatu
// yang tidak bisa terjadi kalau orang mendarat langsung di halaman Midtrans.
async function resendMidtransInvoiceIfPossible(
  registration: {
    id: string;
    nama_lengkap: string;
    kategori: "pelajar" | "umum";
    ukuran_jersey: string;
    final_amount: number;
    midtrans_order_id: string | null;
    payment_expires_at: string | null;
  },
  toEmail: string,
) {
  if (!registration.midtrans_order_id || !registration.payment_expires_at) {
    return;
  }

  try {
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${registration.id}`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject: `Invoice diperbarui — ACS 2026 — ${registration.midtrans_order_id}`,
      html: buildInvoiceEmailHtml({
        namaLengkap: registration.nama_lengkap,
        orderId: registration.midtrans_order_id,
        kategori: registration.kategori,
        ukuranJersey: registration.ukuran_jersey,
        grossAmount: registration.final_amount,
        paymentExpiresAt: registration.payment_expires_at,
        paymentUrl: checkoutUrl,
      }),
    });
  } catch (emailError) {
    console.error(
      "[resendMidtransInvoiceIfPossible] gagal kirim ulang invoice:",
      emailError,
    );
  }
}

// Dipanggil dari ParticipantDataCard.tsx (dipakai di /checkout/[id] maupun
// /checkout/transfer/[id]) saat user klik "Simpan Perubahan". `registrationId`
// di sini berfungsi sebagai capability-link -- sama seperti mekanisme akses
// checkout yang sudah ada sekarang (tidak ada login peserta terpisah di
// project ini, cuma admin dashboard yang punya auth Supabase). Siapa pun
// yang tahu UUID registrationId (dari email invoice / URL checkout mereka)
// dianggap sebagai pemilik registration tersebut, PERSIS seperti cara akses
// /checkout/[id] dan /checkout/transfer/[id] sekarang.
export async function updateRegistrationData(
  registrationId: string,
  data: EditRegistrationPayload,
): Promise<UpdateRegistrationResult> {
  const validationError = validateEditPayload(data);
  if (validationError) return validationError;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, status, email, kategori, nomor_urut, final_amount, midtrans_order_id, payment_expires_at",
    )
    .eq("id", registrationId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Data pendaftaran tidak ditemukan." };
  }

  if (!EDITABLE_STATUSES.has(existing.status as string)) {
    return {
      ok: false,
      error: `Pendaftaran ini sudah tidak bisa diubah datanya (status saat ini: ${existing.status}).`,
    };
  }

  const email = data.email.trim().toLowerCase();
  const emailChanged = email !== (existing.email as string).trim().toLowerCase();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({
      nama_lengkap: data.namaLengkap.trim(),
      email,
      telepon: data.telepon.trim(),
      tempat_lahir: data.tempatLahir.trim(),
      tanggal_lahir: data.tanggalLahir,
      jenis_kelamin: data.jenisKelamin,
      golongan_darah: data.golonganDarah,
      riwayat_penyakit: data.riwayatPenyakit?.trim() || null,
      kontak_darurat_nama: data.kontakDaruratNama.trim(),
      kontak_darurat_telepon: data.kontakDaruratTelepon.trim(),
      ukuran_jersey: data.ukuranJersey,
      nama_bib: data.namaBib.trim(),
    })
    .eq("id", registrationId)
    .select("nama_lengkap, email, telepon, ukuran_jersey")
    .single();

  if (updateError || !updated) {
    console.error("[updateRegistrationData] gagal update registrasi:", updateError);
    return { ok: false, error: "Gagal menyimpan perubahan data, coba lagi." };
  }

  if (emailChanged) {
    const nomorUrut = existing.nomor_urut as number | null;
    const kategori = existing.kategori as "pelajar" | "umum";
    const finalAmount = existing.final_amount as number;
    const midtransOrderId = existing.midtrans_order_id as string | null;
    const paymentExpiresAt = existing.payment_expires_at as string | null;
    const namaLengkapBaru = updated.nama_lengkap as string;
    const ukuranJerseyBaru = updated.ukuran_jersey as string;
    const emailBaru = updated.email as string;

    after(async () => {
      if (nomorUrut !== null) {
        await resendTransferInvoiceIfPossible(
          {
            id: registrationId,
            nama_lengkap: namaLengkapBaru,
            kategori,
            ukuran_jersey: ukuranJerseyBaru,
            nomor_urut: nomorUrut,
            final_amount: finalAmount,
          },
          emailBaru,
        );
      } else {
        await resendMidtransInvoiceIfPossible(
          {
            id: registrationId,
            nama_lengkap: namaLengkapBaru,
            kategori,
            ukuran_jersey: ukuranJerseyBaru,
            final_amount: finalAmount,
            midtrans_order_id: midtransOrderId,
            payment_expires_at: paymentExpiresAt,
          },
          emailBaru,
        );
      }
    });
  }

  return {
    ok: true,
    registration: {
      namaLengkap: updated.nama_lengkap as string,
      email: updated.email as string,
      telepon: updated.telepon as string,
      ukuranJersey: updated.ukuran_jersey as string,
    },
  };
}