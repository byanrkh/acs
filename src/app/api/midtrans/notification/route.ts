import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransSignature } from "@/libs/midtrans/server";
import { applyTransactionStatus } from "@/libs/midtrans/applyStatusUpdate";

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
  const paymentType = body.payment_type as string | undefined;

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

  const result = await applyTransactionStatus({
    orderId,
    transactionStatus,
    fraudStatus,
    source: "webhook",
    paymentType,
    grossAmount,
    rawPayload: body,
  });

  console.log(`[midtrans webhook] hasil applyTransactionStatus:`, result);

  return NextResponse.json({ status: "OK" });
}