import "server-only";
import midtransClient from "midtrans-client";
import crypto from "crypto";

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

if (!serverKey) {
  throw new Error("MIDTRANS_SERVER_KEY belum diisi di .env.local");
}

// PENTING: kita pakai Core API, BUKAN Snap. Snap = Midtrans yang render
// popup/halaman pembayarannya sendiri. Core API = kita cuma minta Midtrans
// generate nomor VA / kode QRIS lewat API, terus UI-nya 100% kita yang
// bikin sendiri (lihat CheckoutClient.tsx + PaymentDetail.tsx).
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

// Dipakai Route Handler notifikasi buat mastiin request beneran dari Midtrans,
// bukan orang iseng nembak endpoint kita langsung. Rumus signature-nya SAMA
// persis antara Snap maupun Core API, jadi fungsi ini tidak berubah.
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