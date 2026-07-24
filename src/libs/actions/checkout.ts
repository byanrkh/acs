"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { snap } from "@/libs/midtrans/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildInvoiceEmailHtml } from "@/libs/email/invoiceTemplate";
import { getRegistrationFee } from "@/libs/config/pricing";
import { buildOrderId } from "@/libs/midtrans/orderId";
import { applyTransactionStatus } from "@/libs/midtrans/applyStatusUpdate";
import { logPaymentEvent } from "@/libs/actions/logs";

const PAYMENT_DURATION_HOURS = 24;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type CreateSnapResult =
  | { ok: true; token: string; redirectUrl: string }
  | { ok: false; error: string };

export async function createSnapTransaction(
  registrationId: string,
): Promise<CreateSnapResult> {
  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    return { ok: false, error: "Data pendaftaran tidak ditemukan." };
  }
  if (registration.status === "confirmed") {
    return {
      ok: false,
      error: "Pendaftaran ini sudah dikonfirmasi, tidak perlu bayar lagi.",
    };
  }
  if (registration.status === "cancelled") {
    return { ok: false, error: "Pendaftaran ini sudah dibatalkan." };
  }

  const grossAmount = getRegistrationFee(registration.kategori);
  const orderId = buildOrderId(registration.id);

  const paymentExpiresAt = new Date(
    Date.now() + PAYMENT_DURATION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const finishUrl = `${APP_URL}/checkout/${registration.id}`;

  let transaction;
  try {
    transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: registration.nama_lengkap,
        email: registration.email,
        phone: registration.telepon,
      },
      expiry: {
        unit: "hours",
        duration: PAYMENT_DURATION_HOURS,
      },
      callbacks: {
        finish: finishUrl,
      },
    });
  } catch (err) {
    console.error("Gagal membuat Snap transaction:", err);
    return { ok: false, error: "Gagal menghubungi Midtrans, coba lagi." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({
      status: "pending_payment",
      midtrans_order_id: orderId,
      midtrans_redirect_url: transaction.redirect_url,
      payment_expires_at: paymentExpiresAt,
    })
    .eq("id", registrationId);

  if (updateError) {
    console.error("Gagal update data pembayaran:", updateError);
    return { ok: false, error: "Gagal menyimpan data pembayaran." };
  }

  await logPaymentEvent({
    registrationId: registration.id,
    orderId,
    source: "checkout",
    statusApplied: "pending_payment",
    grossAmount,
  });

  if (!registration.invoice_email_sent_at) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: registration.email,
        subject: `Invoice pendaftaran ACS 2026 — ${orderId}`,
        html: buildInvoiceEmailHtml({
          namaLengkap: registration.nama_lengkap,
          orderId,
          kategori: registration.kategori,
          ukuranJersey: registration.ukuran_jersey,
          grossAmount,
          paymentExpiresAt,
          paymentUrl: transaction.redirect_url,
        }),
      });

      await supabaseAdmin
        .from("registrations")
        .update({ invoice_email_sent_at: new Date().toISOString() })
        .eq("id", registrationId);
    } catch (emailError) {
      console.error("Gagal mengirim email invoice:", emailError);
    }
  }

  return {
    ok: true,
    token: transaction.token,
    redirectUrl: transaction.redirect_url,
  };
}

export async function checkAndExpireIfPastDeadline(registrationId: string) {
  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select("status, payment_expires_at")
    .eq("id", registrationId)
    .single();

  if (!registration) return null;

  const isPastDeadline =
    registration.status === "pending_payment" &&
    registration.payment_expires_at &&
    new Date(registration.payment_expires_at).getTime() < Date.now();

  if (isPastDeadline) {
    await supabaseAdmin
      .from("registrations")
      .update({ status: "expired" })
      .eq("id", registrationId);
    return "expired" as const;
  }

  return registration.status as string;
}

type ReconcileResult = { status: string | null; bibNumber: string | null };

// FIX UTAMANYA ADA DI SINI: dipanggil dari CheckoutClient (polling otomatis
// + tombol "Cek status sekarang"). Kalau status di DB masih pending_payment,
// fungsi ini AKTIF nanya langsung ke Midtrans lewat Core API — nggak cuma
// pasrah nunggu webhook yang mungkin gagal terkirim.
export async function reconcilePaymentStatus(registrationId: string): Promise<ReconcileResult> {
  console.log(`[reconcilePaymentStatus] dipanggil untuk registrationId=${registrationId}`);

  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select("id, status, midtrans_order_id, bib_number")
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    console.error("[reconcilePaymentStatus] registrasi tidak ditemukan:", error);
    return { status: null, bibNumber: null };
  }

  console.log(
    `[reconcilePaymentStatus] status DB saat ini: ${registration.status}, midtrans_order_id: ${registration.midtrans_order_id}`,
  );

  if (!registration.midtrans_order_id || registration.status !== "pending_payment") {
    return {
      status: registration.status as string,
      bibNumber: registration.bib_number as string | null,
    };
  }

  try {
    const midtransStatus = await snap.transaction.status(registration.midtrans_order_id);
    console.log("[reconcilePaymentStatus] respons dari Midtrans:", midtransStatus);

    const result = await applyTransactionStatus({
      orderId: midtransStatus.order_id,
      transactionStatus: midtransStatus.transaction_status,
      fraudStatus: midtransStatus.fraud_status,
      source: "reconcile",
      paymentType: midtransStatus.payment_type,
      grossAmount: midtransStatus.gross_amount,
    });

    console.log("[reconcilePaymentStatus] hasil applyTransactionStatus:", result);

    if (result.ok) {
      return { status: result.status, bibNumber: result.bibNumber };
    }
  } catch (err) {
    console.warn("[reconcilePaymentStatus] gagal ambil status dari Midtrans:", err);
  }

  return {
    status: registration.status as string,
    bibNumber: registration.bib_number as string | null,
  };
}