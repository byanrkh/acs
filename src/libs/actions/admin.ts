"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildSuccessEmailHtml } from "@/libs/email/successTemplate";
import { buildInvoiceEmailHtml } from "@/libs/email/invoiceTemplate";
import { generateQrCodeBuffer } from "@/libs/email/qrcode";
import { getRegistrationFee } from "@/libs/config/pricing";

export type ScanResult =
  | {
      ok: true;
      registration: {
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
    }
  | { ok: false; error: string };

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// QR di email isinya URL "https://.../admin/validasi/<uuid>". Fungsi ini
// narik UUID-nya keluar, jadi tetep jalan walau nanti URL-nya diubah,
// atau kalau suatu saat QR isinya UUID mentah aja.
function extractRegistrationId(rawScanValue: string): string | null {
  const match = rawScanValue.match(UUID_PATTERN);
  return match ? match[0] : null;
}

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
    .select(
      "id, nama_lengkap, nama_bib, email, telepon, kategori, nisn, nik_terakhir, ukuran_jersey, jenis_kelamin, golongan_darah, riwayat_penyakit, kontak_darurat_nama, kontak_darurat_telepon, status, bib_number, race_pack_taken_at",
    )
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

  return { ok: true, registration };
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
    .select("race_pack_taken_at")
    .single();

  if (error || !data) {
    return { ok: false as const, error: "Gagal update status pengambilan race pack." };
  }

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
      if (!registration.midtrans_redirect_url || !registration.payment_expires_at || !registration.midtrans_order_id) {
        return { ok: false, error: "Data pembayaran belum lengkap, tidak bisa kirim ulang invoice." };
      }

      await resend.emails.send({
        from: EMAIL_FROM,
        to: registration.email,
        subject: `Invoice pendaftaran ACS 2026 — ${registration.midtrans_order_id}`,
        html: buildInvoiceEmailHtml({
          namaLengkap: registration.nama_lengkap,
          orderId: registration.midtrans_order_id,
          kategori: registration.kategori,
          ukuranJersey: registration.ukuran_jersey,
          grossAmount: getRegistrationFee(registration.kategori),
          paymentExpiresAt: registration.payment_expires_at,
          paymentUrl: registration.midtrans_redirect_url,
        }),
      });
    } else {
      return { ok: false, error: `Status "${registration.status}" tidak punya email untuk dikirim ulang.` };
    }
  } catch (err) {
    console.error("[resendRegistrationEmail] gagal kirim:", err);
    return { ok: false, error: "Gagal mengirim email, coba lagi." };
  }

  return { ok: true };
}