import "server-only";
import { supabaseAdmin } from "@/libs/supabase/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildSuccessEmailHtml } from "@/libs/email/successTemplate";
import { parseOrderId } from "@/libs/midtrans/orderId";
import { generateQrCodeBuffer } from "@/libs/email/qrcode";

export type RegistrationStatus = "pending_payment" | "confirmed" | "cancelled" | "expired";

export function mapTransactionStatus(
  transactionStatus: string,
  fraudStatus?: string,
): RegistrationStatus | null {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "confirmed" : "pending_payment";
  }
  if (transactionStatus === "settlement") return "confirmed";
  if (transactionStatus === "pending") return "pending_payment";
  if (transactionStatus === "deny" || transactionStatus === "cancel") return "cancelled";
  if (transactionStatus === "expire") return "expired";
  return null;
}

export type ApplyResult =
  | { ok: true; status: RegistrationStatus; bibNumber: string | null }
  | { ok: false; reason: string };

// Dipakai di DUA jalur, biar logikanya nggak dobel-nulis dan nggak bisa
// beda hasil antara satu jalur dengan yang lain:
//
// 1. WEBHOOK (app/api/midtrans/notification/route.ts) — jalur PASIF,
//    nunggu Midtrans yang kirim notifikasi duluan. Bisa gagal kalau
//    endpoint kamu nggak reachable pas notifikasi itu dikirim.
//
// 2. RECONCILE (libs/actions/checkout.ts → reconcilePaymentStatus) — jalur
//    AKTIF, kita yang nanya balik ke Midtrans "status transaksi ini apa
//    sekarang?" pakai Core API. Ini penyelamat kalau webhook di atas gagal.
export async function applyTransactionStatus({
  orderId,
  transactionStatus,
  fraudStatus,
}: {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string;
}): Promise<ApplyResult> {
  const newStatus = mapTransactionStatus(transactionStatus, fraudStatus);
  if (!newStatus) {
    console.log(`[applyTransactionStatus] status "${transactionStatus}" diabaikan (tidak relevan)`);
    return { ok: false, reason: "status_diabaikan" };
  }

  const parsed = parseOrderId(orderId);
  if (!parsed) {
    console.error(`[applyTransactionStatus] order_id tidak dikenali formatnya: "${orderId}"`);
    return { ok: false, reason: "order_id_tidak_dikenali" };
  }

  const { data: registration, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select("id, status, midtrans_order_id, nama_lengkap, email, bib_number, success_email_sent_at")
    .eq("id", parsed.registrationId)
    .single();

  if (fetchError || !registration) {
    console.error(`[applyTransactionStatus] registrasi tidak ditemukan: ${parsed.registrationId}`, fetchError);
    return { ok: false, reason: "registrasi_tidak_ditemukan" };
  }

  // Cuma order_id yang lagi AKTIF (tersimpan terakhir) yang boleh mengubah
  // status — mencegah notifikasi telat dari percobaan lama nimpa yang baru.
  if (registration.midtrans_order_id !== orderId) {
    console.warn(
      `[applyTransactionStatus] abaikan order_id lama "${orderId}" (order aktif: "${registration.midtrans_order_id}")`,
    );
    return { ok: false, reason: "order_id_lama_diabaikan" };
  }

  // Jangan turunkan status yang udah final.
  if (registration.status === "confirmed" && newStatus !== "confirmed") {
    return { ok: true, status: "confirmed", bibNumber: registration.bib_number };
  }

  if (registration.status !== newStatus) {
    const { error: updateError } = await supabaseAdmin
      .from("registrations")
      .update({ status: newStatus })
      .eq("id", registration.id);

    if (updateError) {
      console.error("[applyTransactionStatus] gagal update status:", updateError);
      return { ok: false, reason: "gagal_update_db" };
    }

    console.log(`[applyTransactionStatus] SUKSES update registrationId=${registration.id} → status=${newStatus}`);
  }

  // Email Ke-2 (konfirmasi + nomor BIB) — sekali per registrasi.
  if (newStatus === "confirmed" && !registration.success_email_sent_at) {
  try {
    const validationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/validasi/${registration.id}`;
    const qrCodeBuffer = await generateQrCodeBuffer(validationUrl);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: registration.email,
      subject: `Pembayaran dikonfirmasi — Nomor BIB kamu: ${registration.bib_number}`,
      html: buildSuccessEmailHtml({
        namaLengkap: registration.nama_lengkap,
        bibNumber: registration.bib_number ?? "-",
      }),
      attachments: [
        {
          filename: "qrcode.png",
          content: qrCodeBuffer,
          contentId: "qrcode_tiket", // ← field yang benar, bukan "cid"
        },
      ],
    });

    await supabaseAdmin
      .from("registrations")
      .update({ success_email_sent_at: new Date().toISOString() })
      .eq("id", registration.id);

    console.log(`[applyTransactionStatus] email ke-2 + QR terkirim ke ${registration.email}`);
  } catch (emailError) {
    console.error("[applyTransactionStatus] gagal kirim email ke-2:", emailError);
  }
}

  return { ok: true, status: newStatus, bibNumber: registration.bib_number };
}