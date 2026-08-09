declare module "midtrans-client" {
  // ============================================================
  // SNAP — dipakai buat generate `token` (dikonsumsi snap.js di frontend
  // lewat window.snap.pay(token, ...)) atau `redirect_url` (kalau mau
  // redirect / buka tab baru ke halaman pembayaran hosted Midtrans).
  // UI metode pembayaran (VA / QRIS / GoPay / dst) di-render Midtrans
  // sendiri di dalam popup/halaman itu — bukan kita yang bikin manual.
  // ============================================================

  export interface MidtransSnapCustomerDetails {
    first_name?: string;
    email?: string;
    phone?: string;
  }

  export interface MidtransSnapTransactionParams {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details?: MidtransSnapCustomerDetails;
    /**
     * Batasi metode pembayaran yang muncul di popup Snap. Kosongkan /
     * jangan dikirim untuk menampilkan semua metode yang aktif di akun
     * Midtrans. ID di sini BEDA dari `payment_type` Core API, contoh:
     * "gopay", "other_qris", "permata_va", "bni_va", "bri_va",
     * "echannel" (Mandiri Bill Payment).
     */
    enabled_payments?: string[];
    expiry?: {
      start_time?: string;
      unit: "second" | "minute" | "hour" | "day";
      duration: number;
    };
    callbacks?: {
      finish?: string;
    };
  }

  export interface MidtransSnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    createTransaction(
      parameter: MidtransSnapTransactionParams,
    ): Promise<MidtransSnapTransactionResponse>;

    createTransactionToken(
      parameter: MidtransSnapTransactionParams,
    ): Promise<string>;

    createTransactionRedirectUrl(
      parameter: MidtransSnapTransactionParams,
    ): Promise<string>;
  }

  // ============================================================
  // CORE API — TIDAK dipakai lagi buat bikin transaksi (charge). Yang
  // masih dipakai cuma endpoint Get Transaction Status
  // (`transaction.status`), buat reconcile status pembayaran secara aktif
  // (lihat libs/actions/checkout.ts -> reconcilePaymentStatus).
  // ============================================================

  export interface MidtransTransactionStatusResponse {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    gross_amount: string;
    status_code: string;
    payment_type?: string;
  }

  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    transaction: {
      status(orderId: string): Promise<MidtransTransactionStatusResponse>;
      cancel(orderId: string): Promise<MidtransTransactionStatusResponse>;
      expire(orderId: string): Promise<MidtransTransactionStatusResponse>;
    };
  }

  const _default: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default _default;
}