declare module "midtrans-client" {
  // ============================================================
  // CORE API — dipakai buat bikin transaksi custom (VA / QRIS)
  // TANPA popup/redirect Snap. Kita yang bikin UI-nya sendiri.
  // ============================================================

  export type MidtransBankTransferBank = "bca" | "bni" | "bri";

  export interface MidtransVANumber {
    bank: string;
    va_number: string;
  }

  export interface MidtransAction {
    name: string;
    method: string;
    url: string;
  }

  export interface MidtransChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    expiry_time?: string;
    currency?: string;

    // bank_transfer (BCA / BNI / BRI)
    va_numbers?: MidtransVANumber[];

    // permata
    permata_va_number?: string;

    // qris
    actions?: MidtransAction[];
    qr_string?: string;
    acquirer?: string;
  }

  export interface MidtransChargeParams {
    payment_type: "bank_transfer" | "permata" | "qris";
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details?: {
      first_name?: string;
      email?: string;
      phone?: string;
    };
    custom_expiry?: {
      expiry_duration: number;
      unit: "second" | "minute" | "hour" | "day";
    };
    bank_transfer?: {
      bank: MidtransBankTransferBank;
    };
    qris?: {
      acquirer?: "gopay" | "airpay shopee";
    };
  }

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

    charge(parameter: MidtransChargeParams): Promise<MidtransChargeResponse>;

    transaction: {
      status(orderId: string): Promise<MidtransTransactionStatusResponse>;
      cancel(orderId: string): Promise<MidtransTransactionStatusResponse>;
      expire(orderId: string): Promise<MidtransTransactionStatusResponse>;
    };
  }

  const _default: { CoreApi: typeof CoreApi };
  export default _default;
}