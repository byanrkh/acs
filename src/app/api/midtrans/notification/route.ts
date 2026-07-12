import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabase/server";
import { verifyMidtransSignature } from "@/libs/midtrans/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

  const validSignature = verifyMidtransSignature({
    orderId: order_id,
    statusCode: status_code,
    grossAmount: gross_amount,
    signatureKey: signature_key,
  });

  if (!validSignature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let newStatus: "pending_payment" | "confirmed" | "cancelled" | "expired" | null = null;

  if (transaction_status === "capture") {
    newStatus = fraud_status === "accept" ? "confirmed" : "pending_payment";
  } else if (transaction_status === "settlement") {
    newStatus = "confirmed";
  } else if (transaction_status === "pending") {
    newStatus = "pending_payment";
  } else if (transaction_status === "deny" || transaction_status === "cancel") {
    newStatus = "cancelled";
  } else if (transaction_status === "expire") {
    newStatus = "expired";
  }

  if (newStatus) {
    const { error } = await supabaseAdmin
      .from("registrations")
      .update({ status: newStatus })
      .eq("midtrans_order_id", order_id);

    if (error) {
      console.error("Gagal update status dari notifikasi Midtrans:", error);
      return NextResponse.json({ message: "DB update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ status: "OK" });
}