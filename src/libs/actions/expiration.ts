import "server-only";
import { after } from "next/server";
import { supabaseAdmin } from "@/libs/supabase/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildExpiredEmailHtml } from "@/libs/email/expiredTemplate";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REGISTRATION_URL = `${APP_URL}/registration`;

type ExpirableRegistration = {
  id: string;
  nama_lengkap: string;
  email: string;
  kategori: "pelajar" | "umum";
  ukuran_jersey: string;
  expired_email_sent_at: string | null;
};

// ============================================================
// SCOPE PENTING: seluruh fungsi di file ini SENGAJA cuma menyentuh
// registrasi channel MIDTRANS (midtrans_order_id IS NOT NULL). Channel
// BANK_TRANSFER (nomor_urut terisi, diverifikasi manual admin) TIDAK
// disentuh sama sekali -- alurnya tetap seperti semula, tanpa deadline
// otomatis, supaya tidak merusak apa pun yang sudah berjalan di jalur itu.
// ============================================================

// Guard idempoten: email "kedaluwarsa" cuma boleh terkirim SEKALI per
// registrasi, ditandai lewat kolom expired_email_sent_at (pola yang sama
// dengan invoice_email_sent_at / success_email_sent_at yang sudah ada).
// Best-effort -- gagal kirim TIDAK boleh menggagalkan transisi status ke
// "expired" itu sendiri (status sudah kepencet berubah duluan sebelum
// fungsi ini dipanggil, lihat expireRegistrationById di bawah).
async function sendExpiredEmailIfNeeded(
  registration: ExpirableRegistration,
): Promise<void> {
  if (registration.expired_email_sent_at) return;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: registration.email,
      subject: "Pendaftaran ACS 2026 kamu kedaluwarsa — daftar ulang yuk",
      html: buildExpiredEmailHtml({
        namaLengkap: registration.nama_lengkap,
        kategori: registration.kategori,
        ukuranJersey: registration.ukuran_jersey,
        registrationUrl: REGISTRATION_URL,
      }),
    });

    await supabaseAdmin
      .from("registrations")
      .update({ expired_email_sent_at: new Date().toISOString() })
      .eq("id", registration.id);
  } catch (emailError) {
    console.error(
      `[expiration] gagal kirim email kedaluwarsa untuk ${registration.id}:`,
      emailError,
    );
  }
}

// Dipanggil buat SATU registrasi spesifik -- dipakai checkout.ts
// (checkAndExpireIfPastDeadline, jalan lazy pas peserta buka halaman
// checkout-nya sendiri, atau dipanggil dari createPaymentTransaction sebagai
// jaga-jaga terakhir sebelum bikin transaksi baru), dan admin.ts
// (resendRegistrationEmail, jaga-jaga sebelum kirim reminder ke link yang
// mungkin sudah kedaluwarsa).
//
// Return value SAMA PERSIS seperti checkAndExpireIfPastDeadline versi lama:
// - string status TERBARU registrasi (termasuk "expired" kalau baru saja
//   ke-flip di panggilan ini)
// - null kalau registrasi tidak ditemukan
export async function expireRegistrationById(
  registrationId: string,
): Promise<string | null> {
  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, status, payment_expires_at, midtrans_order_id, nama_lengkap, email, kategori, ukuran_jersey, expired_email_sent_at",
    )
    .eq("id", registrationId)
    .single();

  if (error || !registration) return null;

  const isMidtransChannel = Boolean(registration.midtrans_order_id);
  const isPastDeadline =
    registration.status === "pending_payment" &&
    isMidtransChannel &&
    Boolean(registration.payment_expires_at) &&
    new Date(registration.payment_expires_at as string).getTime() 
      Date.now();

  if (!isPastDeadline) {
    return registration.status as string;
  }

  // Update BERSYARAT: cuma jalan kalau status di DB MASIH "pending_payment"
  // persis di titik ini -- mencegah race condition kalau webhook Midtrans
  // (mis. "settlement") masuk PERSIS di antara SELECT dan UPDATE ini, yang
  // kalau tidak dijaga bisa menimpa balik status yang harusnya "confirmed"
  // jadi "expired". Timestamp/server (payment_expires_at vs Date.now()) yang
  // jadi sumber kebenaran, bukan timer di frontend.
  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({ status: "expired" })
    .eq("id", registrationId)
    .eq("status", "pending_payment")
    .select("id");

  if (updateError) {
    console.error(
      `[expireRegistrationById] gagal update status expired untuk ${registrationId}:`,
      updateError,
    );
    return registration.status as string;
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Race kejadian: status sudah berubah barusan (mis. webhook masuk
    // duluan). Ambil status TERBARU biar caller dapet nilai yang akurat,
    // bukan status basi dari SELECT di awal fungsi ini.
    const { data: latest } = await supabaseAdmin
      .from("registrations")
      .select("status")
      .eq("id", registrationId)
      .single();
    return (latest?.status as string | undefined) ?? (registration.status as string);
  }

  console.log(
    `[expireRegistrationById] registrationId=${registrationId} -> status=expired (deadline lewat)`,
  );

  after(async () => {
    await sendExpiredEmailIfNeeded({
      id: registration.id as string,
      nama_lengkap: registration.nama_lengkap as string,
      email: registration.email as string,
      kategori: registration.kategori as "pelajar" | "umum",
      ukuran_jersey: registration.ukuran_jersey as string,
      expired_email_sent_at:
        registration.expired_email_sent_at as string | null,
    });
  });

  return "expired";
}

export async function expireAllPastDeadlineRegistrations(): Promise<{
  expiredCount: number;
  failedIds: string[];
}> {
  const nowIso = new Date().toISOString();

  const { data: candidates, error } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .eq("status", "pending_payment")
    .not("midtrans_order_id", "is", null)
    .not("payment_expires_at", "is", null)
    .lt("payment_expires_at", nowIso);

  if (error) {
    console.error(
      "[expireAllPastDeadlineRegistrations] gagal ambil kandidat:",
      error,
    );
    return { expiredCount: 0, failedIds: [] };
  }

  if (!candidates || candidates.length === 0) {
    return { expiredCount: 0, failedIds: [] };
  }

  let expiredCount = 0;
  const failedIds: string[] = [];
  for (const candidate of candidates) {
    const result = await expireRegistrationById(candidate.id as string);
    if (result === "expired") {
      expiredCount += 1;
    } else if (result === null) {
      failedIds.push(candidate.id as string);
    }
  }

  return { expiredCount, failedIds };
}