import "server-only";
import { supabaseAdmin } from "@/libs/supabase/server";

export type AuditLog = {
  id: string;
  actor_email: string | null;
  action: string;
  description: string;
  registration_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type PaymentLog = {
  id: string;
  registration_id: string | null;
  order_id: string;
  source: string;
  transaction_status: string | null;
  fraud_status: string | null;
  payment_type: string | null;
  gross_amount: number | null;
  status_applied: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
};

// Dipanggil dari mana aja di admin.ts / checkout.ts pas ada aksi manual admin
// (bukan mutasi pembayaran). Sengaja "fire and forget" — kalau gagal insert
// log, jangan sampai bikin aksi utamanya (misal kirim email) ikut gagal.
export async function logAuditEvent({
  actorEmail,
  action,
  description,
  registrationId,
  metadata,
}: {
  actorEmail?: string | null;
  action: string;
  description: string;
  registrationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_email: actorEmail ?? null,
    action,
    description,
    registration_id: registrationId ?? null,
    metadata: metadata ?? null,
  });

  if (error) {
    console.error("[logAuditEvent] gagal simpan audit log:", error);
  }
}

// Dipanggil dari applyTransactionStatus (dipakai webhook & reconcile) dan
// pas createSnapTransaction bikin order baru, buat nyatet histori mutasi.
export async function logPaymentEvent({
  registrationId,
  orderId,
  source,
  transactionStatus,
  fraudStatus,
  paymentType,
  grossAmount,
  statusApplied,
  rawPayload,
}: {
  registrationId?: string | null;
  orderId: string;
  source: "webhook" | "reconcile" | "checkout";
  transactionStatus?: string | null;
  fraudStatus?: string | null;
  paymentType?: string | null;
  grossAmount?: number | string | null;
  statusApplied?: string | null;
  rawPayload?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("payment_logs").insert({
    registration_id: registrationId ?? null,
    order_id: orderId,
    source,
    transaction_status: transactionStatus ?? null,
    fraud_status: fraudStatus ?? null,
    payment_type: paymentType ?? null,
    gross_amount: grossAmount ? Number(grossAmount) : null,
    status_applied: statusApplied ?? null,
    raw_payload: rawPayload ?? null,
  });

  if (error) {
    console.error("[logPaymentEvent] gagal simpan payment log:", error);
  }
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select(
      "id, actor_email, action, description, registration_id, metadata, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getAuditLogs] gagal ambil audit log:", error);
    return [];
  }

  return data ?? [];
}

export async function getPaymentLogs(limit = 50): Promise<PaymentLog[]> {
  const { data, error } = await supabaseAdmin
    .from("payment_logs")
    .select(
      "id, registration_id, order_id, source, transaction_status, fraud_status, payment_type, gross_amount, status_applied, raw_payload, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getPaymentLogs] gagal ambil payment log:", error);
    return [];
  }

  return data ?? [];
}