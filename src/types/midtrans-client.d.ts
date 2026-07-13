declare module "midtrans-client" {
  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });

    createTransaction(parameter: Record<string, unknown>): Promise<{
      token: string;
      redirect_url: string;
    }>;

    transaction: {
      status(orderId: string): Promise<{
        order_id: string;
        transaction_status: string;
        fraud_status?: string;
        gross_amount: string;
        status_code: string;
        payment_type?: string;
      }>;
    };
  }

  const _default: { Snap: typeof Snap };
  export default _default;
}