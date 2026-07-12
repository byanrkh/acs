import "server-only";
import midtransClient from "midtrans-client";
import crypto from "crypto";

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

if (!serverKey) {
  throw new Error("MIDTRANS_SERVER_KEY belum diisi di .env.local");
}

export const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
});

// Dipakai Route Handler notifikasi buat mastiin request beneran dari Midtrans,
// bukan orang iseng nembak endpoint kita langsung.
export function verifyMidtransSignature({
  orderId,
  statusCode,
  grossAmount,
  signatureKey,
}: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}) {
  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return expected === signatureKey;
}