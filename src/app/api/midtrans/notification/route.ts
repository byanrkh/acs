import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabase/server";
import { verifyMidtransSignature } from "@/libs/midtrans/server";
import { parseOrderId } from "@/libs/midtrans/orderId";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildSuccessEmailHtml } from "@/libs/email/successTemplate";

type RegistrationStatus = "pending_payment" | "confirmed" | "cancelled" | "expired";

function mapTransactionStatus(
  transactionStatus: string,
  fraudStatus: string | undefined,
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

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    console.error("[midtrans webhook] body bukan JSON valid");
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  console.log("[midtrans webhook] payload masuk:", JSON.stringify(body));

  const orderId = body.order_id as string | undefined;
  const statusCode = body.status_code as string | undefined;
  const grossAmount = body.gross_amount as string | undefined;
  const signatureKey = body.signature_key as string | undefined;
  const transactionStatus = body.transaction_status as string | undefined;
  const fraudStatus = body.fraud_status as string | undefined;

  if (!orderId || !statusCode || !grossAmount || !signatureKey || !transactionStatus) {
    console.error("[midtrans webhook] payload tidak lengkap:", body);
    return NextResponse.json({ message: "Payload tidak lengkap" }, { status: 400 });
  }

  const validSignature = verifyMidtransSignature({
    orderId,
    statusCode,
    grossAmount,
    signatureKey,
  });

  if (!validSignature) {
    console.error("[midtrans webhook] SIGNATURE TIDAK VALID untuk order_id:", orderId);
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const parsed = parseOrderId(orderId);
  if (!parsed) {
    console.error("[midtrans webhook] order_id tidak dikenali formatnya:", orderId);
    return NextResponse.json({ status: "OK (unrecognized order_id, ignored)" });
  }

  const newStatus = mapTransactionStatus(transactionStatus, fraudStatus);
  console.log(
    `[midtrans webhook] order_id=${orderId} → registrationId=${parsed.registrationId}, ` +
      `transaction_status=${transactionStatus}, fraud_status=${fraudStatus ?? "-"}, newStatus=${newStatus}`,
  );

  if (!newStatus) {
    return NextResponse.json({ status: "OK (status diabaikan)" });
  }

  const { data: registration, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select("id, status, midtrans_order_id, nama_lengkap, email, bib_number, success_email_sent_at")
    .eq("id", parsed.registrationId)
    .single();

  if (fetchError || !registration) {
    console.error("[midtrans webhook] registrasi TIDAK DITEMUKAN:", parsed.registrationId, fetchError);
    return NextResponse.json({ message: "Registrasi tidak ditemukan" }, { status: 404 });
  }

  // Guard #1 — cuma notifikasi dari order_id yang lagi AKTIF (tersimpan
  // terakhir di kolom midtrans_order_id) yang boleh mengubah status.
  if (registration.midtrans_order_id !== orderId) {
    console.warn(
      `[midtrans webhook] abaikan notifikasi order_id lama "${orderId}" (order aktif: "${registration.midtrans_order_id}")`,
    );
    return NextResponse.json({ status: "OK (stale order_id, ignored)" });
  }

  // Guard #2 — jangan turunkan status yang udah final.
  if (registration.status === "confirmed" && newStatus !== "confirmed") {
    return NextResponse.json({ status: "OK (already confirmed, ignored)" });
  }

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({ status: newStatus })
    .eq("id", registration.id);

  if (updateError) {
    console.error("[midtrans webhook] GAGAL update status:", updateError);
    return NextResponse.json({ message: "DB update failed" }, { status: 500 });
  }

  console.log(`[midtrans webhook] SUKSES update registrationId=${registration.id} → status=${newStatus}`);

  // Email Ke-2 (konfirmasi sukses + nomor BIB) — sekali per registrasi.
  if (newStatus === "confirmed" && !registration.success_email_sent_at) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: registration.email,
        subject: `Pembayaran dikonfirmasi — Nomor BIB kamu: ${registration.bib_number}`,
        html: buildSuccessEmailHtml({
          namaLengkap: registration.nama_lengkap,
          bibNumber: registration.bib_number ?? "-",
        }),
      });

      await supabaseAdmin
        .from("registrations")
        .update({ success_email_sent_at: new Date().toISOString() })
        .eq("id", registration.id);

      console.log(`[midtrans webhook] email ke-2 terkirim ke ${registration.email}`);
    } catch (emailError) {
      console.error("[midtrans webhook] gagal kirim email ke-2:", emailError);
    }
  }

  return NextResponse.json({ status: "OK" });
}