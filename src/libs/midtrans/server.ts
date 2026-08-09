import "server-only";
import midtransClient from "midtrans-client";
import crypto from "crypto";

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

if (!serverKey) {
  throw new Error("MIDTRANS_SERVER_KEY belum diisi di .env.local");
}

// Snap = Midtrans yang render UI pembayarannya sendiri (popup snap.js di
// frontend lewat window.snap.pay(token, ...), atau redirect_url kalau mau
// buka halaman pembayaran hosted Midtrans di tab/redirect terpisah).
// Client ini dipakai buat generate `token` + `redirect_url` di
// libs/actions/checkout.ts (createPaymentTransaction).
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

// PENTING: coreApi DI SINI BUKAN buat bikin transaksi (charge) lagi — itu
// sudah sepenuhnya pindah ke Snap di atas. Satu-satunya alasan client ini
// masih dipakai adalah endpoint "Get Transaction Status"
// (`coreApi.transaction.status`), yang dipanggil dari
// libs/actions/checkout.ts (reconcilePaymentStatus) buat AKTIF nanya balik
// status pembayaran ke Midtrans — jaga-jaga kalau webhook notifikasi gagal
// terkirim. Endpoint status ini memang cuma tersedia lewat Core API client,
// baik transaksinya dibuat lewat Snap maupun Core API charge, jadi ini
// bukan sisa Core API charge flow yang lama.
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

// Dipakai Route Handler notifikasi buat mastiin request beneran dari Midtrans,
// bukan orang iseng nembak endpoint kita langsung. Rumus signature-nya SAMA
// persis antara Snap maupun Core API, jadi fungsi ini tidak berubah sama
// sekali dari implementasi lama.
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