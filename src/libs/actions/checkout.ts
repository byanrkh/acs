"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { snap } from "@/libs/midtrans/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildInvoiceEmailHtml } from "@/libs/email/invoiceTemplate";
import { getRegistrationFee } from "@/libs/config/pricing";

const PAYMENT_DURATION_HOURS = 24;

type CreateSnapResult =
  | { ok: true; token: string; redirectUrl: string }
  | { ok: false; error: string };

export async function createSnapTransaction(registrationId: string): Promise<CreateSnapResult> {
  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select("*")
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    return { ok: false, error: "Data pendaftaran tidak ditemukan." };
  }
  if (registration.status === "confirmed") {
    return { ok: false, error: "Pendaftaran ini sudah dikonfirmasi, tidak perlu bayar lagi." };
  }
  if (registration.status === "cancelled") {
    return { ok: false, error: "Pendaftaran ini sudah dibatalkan." };
  }

  const grossAmount = getRegistrationFee(registration.kategori);
  const isRetry = registration.status === "expired";

  // Order id cuma dibuat baru kalau ini transaksi pertama, atau kalau
  // sebelumnya expired dan user coba bayar ulang — Midtrans wajib order_id unik.
  const orderId =
    registration.midtrans_order_id && !isRetry
      ? registration.midtrans_order_id
      : `ACS-${registration.id.slice(0, 8)}-${Date.now()}`;

  const paymentExpiresAt = new Date(
    Date.now() + PAYMENT_DURATION_HOURS * 60 * 60 * 1000
  ).toISOString();

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

  // Email Ke-1 (Invoice) — sengaja CUMA dikirim sekali per registrasi
  // (dicek lewat invoice_email_sent_at), bukan tiap kali token dibuat.
  // Kalau maunya beneran tiap create token, tinggal hapus pengecekan ini —
  // tapi risikonya user bisa spam klik & kebanjiran email yang sama.
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
      // Gagal kirim email TIDAK menggagalkan proses bayar — token Snap
      // tetap dikasih ke user, kegagalan cuma dicatat di log server.
      console.error("Gagal mengirim email invoice:", emailError);
    }
  }

  return { ok: true, token: transaction.token, redirectUrl: transaction.redirect_url };
}

// Fallback kalau webhook Midtrans belum sempat / gagal masuk — dicek tiap
// halaman checkout dibuka, biar UI tetap jujur meskipun webhook telat.
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
    await supabaseAdmin.from("registrations").update({ status: "expired" }).eq("id", registrationId);
    return "expired" as const;
  }

  return registration.status as string;
}

export async function getRegistrationStatus(registrationId: string) {
  const { data } = await supabaseAdmin
    .from("registrations")
    .select("status")
    .eq("id", registrationId)
    .single();

  return data?.status ?? null;
}