"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildSuccessEmailHtml } from "@/libs/email/successTemplate";
import { generateQrCodeBuffer } from "@/libs/email/qrcode";
import { logAuditEvent, logPaymentEvent } from "@/libs/actions/logs";

export type ApproveTransferResult =
  | { ok: true; bibNumber: string | null }
  | { ok: false; error: string };

// Dipakai dari /dashboard/transfer. Pola-nya sengaja disamakan dengan
// applyTransactionStatus (jalur Midtrans) — update status → baca ulang row
// → bib_number sudah otomatis terisi dari trigger DB → kirim email e-ticket
// yang sama persis dengan yang dipakai jalur Midtrans.
export async function approveTransferPayment(
  registrationId: string,
): Promise<ApproveTransferResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data: registration, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, status, nama_lengkap, nama_bib, email, kategori, ukuran_jersey, success_email_sent_at",
    )
    .eq("id", registrationId)
    .single();

  if (fetchError || !registration) {
    return { ok: false, error: "Data peserta tidak ditemukan." };
  }

  if (registration.status !== "waiting_verification") {
    return {
      ok: false,
      error: `Status peserta bukan "waiting_verification" (status saat ini: ${registration.status}).`,
    };
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({ status: "confirmed" })
    .eq("id", registrationId)
    .select("bib_number")
    .single();

  if (updateError || !updated) {
    console.error("[approveTransferPayment] gagal update status:", updateError);
    return { ok: false, error: "Gagal mengubah status peserta." };
  }

  // Email e-ticket (sama persis dengan yang dipakai jalur Midtrans) —
  // sekali per registrasi, dijaga lewat success_email_sent_at.
  if (!registration.success_email_sent_at) {
    try {
      const validationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/validasi/${registration.id}`;
      const qrCodeBuffer = await generateQrCodeBuffer(validationUrl);

      await resend.emails.send({
        from: EMAIL_FROM,
        to: registration.email,
        subject: `Pembayaran dikonfirmasi — Nomor BIB kamu: ${updated.bib_number ?? "-"}`,
        html: buildSuccessEmailHtml({
          namaLengkap: registration.nama_lengkap,
          namaBib: registration.nama_bib,
          bibNumber: updated.bib_number ?? "-",
          kategori: registration.kategori,
          ukuranJersey: registration.ukuran_jersey,
        }),
        attachments: [
          { filename: "qrcode.png", content: qrCodeBuffer, contentId: "qrcode_tiket" },
        ],
      });

      await supabaseAdmin
        .from("registrations")
        .update({ success_email_sent_at: new Date().toISOString() })
        .eq("id", registrationId);
    } catch (emailError) {
      console.error("[approveTransferPayment] gagal kirim email e-ticket:", emailError);
    }
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "approve_transfer_payment",
    description: `Approve pembayaran transfer bank untuk ${registration.nama_lengkap} (BIB ${updated.bib_number ?? "-"})`,
    registrationId,
    metadata: {
      nama_lengkap: registration.nama_lengkap,
      nama_bib: registration.nama_bib,
      bib_number: updated.bib_number,
      kategori: registration.kategori,
      email: registration.email,
    },
  });

  await logPaymentEvent({
    registrationId,
    orderId: `TRANSFER-${registrationId}`,
    source: "checkout",
    statusApplied: "confirmed",
  });

  return { ok: true, bibNumber: updated.bib_number as string | null };
}