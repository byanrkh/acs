"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildSuccessEmailHtml } from "@/libs/email/successTemplate";
import { buildReminderEmailHtml } from "@/libs/email/reminderTemplate";
import { buildTransferReminderEmailHtml } from "@/libs/email/transferInvoiceTemplate";
import { generateQrCodeBuffer } from "@/libs/email/qrcode";
import { getRegistrationFee } from "@/libs/config/pricing";
import { logAuditEvent } from "@/libs/actions/logs";
import type { EditRegistrationPayload } from "@/libs/actions/registration";

// Shape data peserta yang dipakai bareng oleh hasil scan QR/HID (selalu 1
// data spesifik) maupun hasil pencarian manual (bisa lebih dari 1 data,
// karena email/NISN/telepon sekarang boleh dipakai berkali-kali daftar).
export type ScanRegistration = {
  id: string;
  nama_lengkap: string;
  nama_bib: string;
  email: string;
  telepon: string;
  kategori: "pelajar" | "umum";
  nisn: string | null;
  nik_terakhir: string | null;
  ukuran_jersey: string;
  jenis_kelamin: "L" | "P";
  golongan_darah: string;
  riwayat_penyakit: string | null;
  kontak_darurat_nama: string;
  kontak_darurat_telepon: string;
  status: string;
  bib_number: string | null;
  race_pack_taken_at: string | null;
};

export type ScanResult =
  | { ok: true; registration: ScanRegistration }
  | { ok: false; error: string };

// Hasil pencarian manual (email/no. HP) BISA balikin lebih dari satu data
// sekarang, karena satu email/NISN/telepon boleh dipakai lebih dari sekali
// daftar. Sengaja dipisah dari ScanResult (yang tetap 1 data spesifik)
// supaya UI scan lewat kamera/HID (hasilnya selalu presisi 1 orang lewat
// UUID di QR) tidak perlu berubah sama sekali.
export type ContactLookupResult =
  | { ok: true; registrations: ScanRegistration[] }
  | { ok: false; error: string };

// Kolom yang dipakai bareng oleh lookupRegistrationByScan (QR/HID) dan
// lookupRegistrationByContact (input manual email/no. HP), biar dua-duanya
// selalu balikin shape data yang identik ke UI.
const SCAN_SELECT_FIELDS =
  "id, nama_lengkap, nama_bib, email, telepon, kategori, nisn, nik_terakhir, ukuran_jersey, jenis_kelamin, golongan_darah, riwayat_penyakit, kontak_darurat_nama, kontak_darurat_telepon, status, bib_number, race_pack_taken_at";

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// NIK itu data pribadi sensitif -- cuma dev@acs.id yang boleh lihat nilai
// aslinya. Admin lain tetap bisa lihat semua data peserta lainnya seperti
// biasa, tapi kolom NIK-nya disamarkan.
const NIK_VISIBLE_EMAIL = "dev@acs.id";

function maskNik<T extends { nik_terakhir: string | null }>(
  reg: T,
  viewerEmail: string | null | undefined,
): T {
  if (viewerEmail === NIK_VISIBLE_EMAIL || reg.nik_terakhir === null) {
    return reg;
  }
  return { ...reg, nik_terakhir: reg.nik_terakhir.slice(-4) };
}

// QR di email isinya URL "https://.../admin/validasi/<uuid>". Fungsi ini
// narik UUID-nya keluar, jadi tetep jalan walau nanti URL-nya diubah,
// atau kalau suatu saat QR isinya UUID mentah aja.
function extractRegistrationId(rawScanValue: string): string | null {
  const match = rawScanValue.match(UUID_PATTERN);
  return match ? match[0] : null;
}

// Scan lewat kamera (html5-qrcode) ATAU HID barcode scanner. QR/barcode-nya
// selalu ngebawa UUID registrasi yang spesifik punya SATU orang, jadi hasil
// dari jalur ini SELALU 1 data spesifik — tidak terpengaruh sama sekali oleh
// kebijakan "email/NISN/telepon boleh dipakai berkali-kali daftar", karena
// yang dicocokkan di sini adalah id (primary key), bukan email/NISN/telepon.
export async function lookupRegistrationByScan(rawScanValue: string): Promise<ScanResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const registrationId = extractRegistrationId(rawScanValue.trim());
  if (!registrationId) {
    return { ok: false, error: "QR code tidak dikenali." };
  }

  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select(SCAN_SELECT_FIELDS)
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    return { ok: false, error: "Peserta tidak ditemukan di database." };
  }

  if (registration.status !== "confirmed") {
    return {
      ok: false,
      error: `Peserta ditemukan, tapi status pendaftaran belum "confirmed" (status saat ini: ${registration.status}).`,
    };
  }

  return { ok: true, registration: maskNik(registration, admin.email) };
}

// --- Deteksi & normalisasi buat input manual (email ATAU nomor HP) ---

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

// Nomor HP di DB disimpan format lokal "08xxxxxxxxxx" (lihat validasi di
// RegistrationForm). Panitia di venue bisa aja ngetik "+62...", "62...",
// atau ada spasi/strip — jadi kita normalisasi dulu ke format "0..." biar
// tetap ketemu meski format ketikannya beda-beda.
function normalizePhoneNumber(rawValue: string): string {
  let digits = rawValue.replace(/\D/g, "");
  if (digits.startsWith("620")) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.startsWith("62")) {
    digits = `0${digits.slice(2)}`;
  }
  return digits;
}

// Dipakai oleh panel "Input Manual" di halaman Scan — fallback kalau QR
// peserta rusak/ga kebawa, tapi panitia tau email atau nomor HP-nya.
// Search-nya auto-detect: ada "@" → dianggap email, selain itu → nomor HP.
//
// PERUBAHAN: dulu jalur ini cuma balikin 1 data (row paling baru) via
// .maybeSingle(). Sekarang, karena satu email/nomor HP bisa kepakai buat
// lebih dari satu pendaftaran, jalur ini balikin SEMUA data yang cocok
// (diurutkan dari yang paling baru daftar), biar panitia bisa milih data
// yang mana yang mau diproses race pack-nya kalau ternyata ada lebih dari
// satu. Pengecekan status "confirmed" TIDAK dilakukan di sini lagi —
// dipindah ke saat panitia memilih salah satu data dari daftar hasil
// pencarian (lihat ScanPage), supaya data yang belum confirmed tetap
// kelihatan di daftar (biar panitia tau alasannya), bukan malah "hilang".
export async function lookupRegistrationByContact(
  rawValue: string,
): Promise<ContactLookupResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { ok: false, error: "Isi email atau nomor HP peserta dulu." };
  }

  const isEmail = looksLikeEmail(trimmed);
  const normalizedPhone = normalizePhoneNumber(trimmed);

  if (!isEmail && normalizedPhone.length < 8) {
    return { ok: false, error: "Nomor HP tidak valid, cek lagi ketikannya." };
  }

  const query = supabaseAdmin
    .from("registrations")
    .select(SCAN_SELECT_FIELDS)
    .order("created_at", { ascending: false });

  const { data: registrations, error } = isEmail
    ? await query.ilike("email", trimmed)
    : await query.eq("telepon", normalizedPhone);

  if (error) {
    console.error("[lookupRegistrationByContact] gagal cari data:", error);
    return { ok: false, error: "Terjadi kesalahan saat mencari data, coba lagi." };
  }

  if (!registrations || registrations.length === 0) {
    return {
      ok: false,
      error: "Peserta dengan email/nomor HP tersebut tidak ditemukan.",
    };
  }

  return {
    ok: true,
    registrations: registrations.map((reg) => maskNik(reg, admin.email)),
  };
}

export async function markRacePackTaken(registrationId: string) {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false as const, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data, error } = await supabaseAdmin
    .from("registrations")
    .update({ race_pack_taken_at: new Date().toISOString() })
    .eq("id", registrationId)
    .select("race_pack_taken_at, nama_lengkap, nama_bib, bib_number, kategori, email")
    .single();

  if (error || !data) {
    return { ok: false as const, error: "Gagal update status pengambilan race pack." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "race_pack_taken",
    description: `Menandai race pack diambil oleh ${data.nama_lengkap} (BIB ${data.bib_number ?? "-"})`,
    registrationId,
    metadata: {
      nama_lengkap: data.nama_lengkap,
      nama_bib: data.nama_bib,
      bib_number: data.bib_number,
      kategori: data.kategori,
      email: data.email,
    },
  });

  return { ok: true as const, race_pack_taken_at: data.race_pack_taken_at as string };
}

// Buat tombol "Kirim ulang email" di /dashboard — berguna kalau peserta
// ngaku emailnya kesasar / nyangkut di folder Junk. Nggak nyentuh kolom
// *_email_sent_at, jadi nggak ganggu guard "kirim sekali" di webhook.
export async function resendRegistrationEmail(
  registrationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }


  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    return { ok: false, error: "Data peserta tidak ditemukan." };
  }

  try {
    if (registration.status === "confirmed") {
      const validationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/validasi/${registration.id}`;
      const qrCodeBuffer = await generateQrCodeBuffer(validationUrl);

      await resend.emails.send({
        from: EMAIL_FROM,
        to: registration.email,
        subject: `Pembayaran dikonfirmasi — Nomor BIB kamu: ${registration.bib_number}`,
        html: buildSuccessEmailHtml({
          namaLengkap: registration.nama_lengkap,
          namaBib: registration.nama_bib,
          bibNumber: registration.bib_number ?? "-",
          kategori: registration.kategori,
          ukuranJersey: registration.ukuran_jersey,
        }),
        attachments: [
          { filename: "qrcode.png", content: qrCodeBuffer, contentId: "qrcode_tiket" },
        ],
      });
    } else if (registration.status === "pending_payment") {
      // Dua jalur pembayaran nyampur di status ini: Midtrans (punya
      // midtrans_order_id + tenggat waktu) dan transfer bank manual
      // (punya nomor_urut, TANPA tenggat waktu). Nadanya beda dikit,
      // dan buat transfer sengaja gak ada info deadline.
      const isTransferFlow = !registration.midtrans_order_id;

      if (isTransferFlow) {
        if (!registration.nomor_urut) {
          return { ok: false, error: "Data transfer belum lengkap, tidak bisa kirim reminder." };
        }

        const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/transfer/${registration.id}`;
        const grossAmount = getRegistrationFee(registration.kategori) + registration.nomor_urut;

        await resend.emails.send({
          from: EMAIL_FROM,
          to: registration.email,
          subject: `Pengingat: bukti transfer ACS 2026 kamu belum kami terima`,
          html: buildTransferReminderEmailHtml({
            namaLengkap: registration.nama_lengkap,
            kategori: registration.kategori,
            ukuranJersey: registration.ukuran_jersey,
            grossAmount,
            checkoutUrl,
          }),
        });
      } else {
        if (!registration.midtrans_order_id || !registration.payment_expires_at) {
          return { ok: false, error: "Data pembayaran belum lengkap, tidak bisa kirim reminder." };
        }

        // Jaga-jaga kalau belum ke-flip ke "expired" (cron
        // expire-pending-registrations biasanya sudah menangani ini duluan,
        // tapi tetap dicek ulang di sini) — daripada ngirim reminder ke
        // registrasi yang udah kedaluwarsa, update dulu statusnya.
        const isPastDeadline =
          new Date(registration.payment_expires_at).getTime() < Date.now();

        if (isPastDeadline) {
          await supabaseAdmin
            .from("registrations")
            .update({ status: "expired" })
            .eq("id", registrationId);

          return {
            ok: false,
            error:
              "Pendaftaran ini sudah lewat tenggat bayar (kedaluwarsa). Minta peserta daftar ulang, bukan bayar invoice lama.",
          };
        }

        // PENTING: link di email SELALU halaman checkout KITA
        // (/checkout/[id]), BUKAN registration.midtrans_redirect_url
        // (halaman hosted Midtrans langsung). Checkout kita yang jadi
        // satu-satunya pintu bayar -- begitu status expired, halaman itu
        // sendiri yang menolak & mengarahkan ke pendaftaran ulang (lihat
        // CheckoutClient.tsx), sesuatu yang tidak bisa dilakukan kalau
        // orang mendarat langsung di halaman Midtrans.
        const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${registration.id}`;

        await resend.emails.send({
          from: EMAIL_FROM,
          to: registration.email,
          subject: `Pengingat: pembayaran pendaftaran ACS 2026 kamu belum kami terima`,
          html: buildReminderEmailHtml({
            namaLengkap: registration.nama_lengkap,
            orderId: registration.midtrans_order_id,
            kategori: registration.kategori,
            ukuranJersey: registration.ukuran_jersey,
            grossAmount: getRegistrationFee(registration.kategori),
            paymentExpiresAt: registration.payment_expires_at,
            paymentUrl: checkoutUrl,
          }),
        });
      }
    } else {
      return { ok: false, error: `Status "${registration.status}" tidak punya email untuk dikirim ulang.` };
    }
  } catch (err) {
    console.error("[resendRegistrationEmail] gagal kirim:", err);
    await logAuditEvent({
      actorEmail: admin.email,
      action: "resend_email_failed",
      description: `Gagal kirim ulang email untuk ${registration.nama_lengkap} (status: ${registration.status})`,
      registrationId,
      metadata: {
        nama_lengkap: registration.nama_lengkap,
        nama_bib: registration.nama_bib,
        bib_number: registration.bib_number,
        email: registration.email,
        status: registration.status,
      },
    });
    return { ok: false, error: "Gagal mengirim email, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "resend_email",
    description: `Kirim ulang email untuk ${registration.nama_lengkap} (status "${registration.status}")`,
    registrationId,
    metadata: {
      nama_lengkap: registration.nama_lengkap,
      nama_bib: registration.nama_bib,
      bib_number: registration.bib_number,
      email: registration.email,
      status: registration.status,
    },
  });

  return { ok: true };
}

export async function deleteRegistration(
  registrationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select("id, nama_lengkap, nama_bib, email, bib_number, status")
    .eq("id", registrationId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Data peserta tidak ditemukan." };
  }

  const { error: deleteError } = await supabaseAdmin
    .from("registrations")
    .delete()
    .eq("id", registrationId);

  if (deleteError) {
    console.error("[deleteRegistration] gagal hapus peserta:", deleteError);
    return { ok: false, error: "Gagal menghapus data peserta, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "delete_registration",
    description: `Menghapus data peserta "${existing.nama_lengkap}" (BIB ${existing.bib_number ?? "-"}, status "${existing.status}")`,
    registrationId: existing.id,
    metadata: {
      nama_lengkap: existing.nama_lengkap,
      nama_bib: existing.nama_bib,
      email: existing.email,
      bib_number: existing.bib_number,
      status: existing.status,
    },
  });

  return { ok: true };
}

// ============================================================
// EDIT DATA PESERTA DARI DASHBOARD ADMIN
// ============================================================
// Beda dari updateRegistrationData di registration.ts (yang dipakai peserta
// sendiri lewat capability-link di halaman checkout dan CUMA bisa dipakai
// selagi status masih "pending_payment"): admin boleh edit data peserta di
// status APAPUN (termasuk confirmed/waiting_verification/expired/cancelled),
// karena kadang panitia perlu benerin typo/salah input walau pembayaran
// sudah beres. Field yang bisa diubah SENGAJA dibikin identik dengan jalur
// peserta (EditRegistrationPayload) -- kategori & NISN/NIK tetap tidak bisa
// diubah lewat sini karena itu identifier utama buat duplicate prevention &
// penentuan harga (lihat registration.ts), ubahnya harus lewat Supabase
// langsung kalau memang perlu.
export type AdminUpdateRegistrationResult =
  | {
      ok: true;
      registration: {
        namaLengkap: string;
        email: string;
        telepon: string;
        tempatLahir: string;
        tanggalLahir: string;
        jenisKelamin: "L" | "P";
        golonganDarah: string;
        riwayatPenyakit: string | null;
        kontakDaruratNama: string;
        kontakDaruratTelepon: string;
        ukuranJersey: string;
        namaBib: string;
      };
    }
  | { ok: false; error: string; field?: keyof EditRegistrationPayload };

function validateAdminEditPayload(
  data: EditRegistrationPayload,
): AdminUpdateRegistrationResult | null {
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

export async function adminUpdateRegistrationData(
  registrationId: string,
  data: EditRegistrationPayload,
): Promise<AdminUpdateRegistrationResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const validationError = validateAdminEditPayload(data);
  if (validationError) return validationError;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select("id, nama_lengkap, status")
    .eq("id", registrationId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Data peserta tidak ditemukan." };
  }

  const email = data.email.trim().toLowerCase();

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
    .select(
      "nama_lengkap, email, telepon, tempat_lahir, tanggal_lahir, jenis_kelamin, golongan_darah, riwayat_penyakit, kontak_darurat_nama, kontak_darurat_telepon, ukuran_jersey, nama_bib",
    )
    .single();

  if (updateError || !updated) {
    console.error("[adminUpdateRegistrationData] gagal update data peserta:", updateError);
    return { ok: false, error: "Gagal menyimpan perubahan data, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "edit_registration_data",
    description: `Admin mengubah data peserta "${existing.nama_lengkap}" (status "${existing.status}")`,
    registrationId,
    metadata: {
      nama_lengkap: updated.nama_lengkap,
      email: updated.email,
      telepon: updated.telepon,
    },
  });

  return {
    ok: true,
    registration: {
      namaLengkap: updated.nama_lengkap as string,
      email: updated.email as string,
      telepon: updated.telepon as string,
      tempatLahir: updated.tempat_lahir as string,
      tanggalLahir: updated.tanggal_lahir as string,
      jenisKelamin: updated.jenis_kelamin as "L" | "P",
      golonganDarah: updated.golongan_darah as string,
      riwayatPenyakit: updated.riwayat_penyakit as string | null,
      kontakDaruratNama: updated.kontak_darurat_nama as string,
      kontakDaruratTelepon: updated.kontak_darurat_telepon as string,
      ukuranJersey: updated.ukuran_jersey as string,
      namaBib: updated.nama_bib as string,
    },
  };
}