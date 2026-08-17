"use server";

import { after } from "next/server";
import { supabaseAdmin } from "@/libs/supabase/server";
import { snap } from "@/libs/midtrans/server";
import { coreApi } from "@/libs/midtrans/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildInvoiceEmailHtml } from "@/libs/email/invoiceTemplate";
import { getRegistrationFee } from "@/libs/config/pricing";
import { buildOrderId } from "@/libs/midtrans/orderId";
import { applyTransactionStatus } from "@/libs/midtrans/applyStatusUpdate";
import { logPaymentEvent } from "@/libs/actions/logs";
import {
  getEnabledPaymentMethods,
  type PaymentMethodId,
} from "@/libs/actions/paymentSettings";
import { PAYMENT_DURATION_HOURS } from "@/libs/config/payment";
import type { MidtransSnapTransactionResponse } from "midtrans-client";

// Batas waktu bayar (3 jam) didefinisikan di libs/config/payment.ts, BUKAN
// di file ini -- karena file ini punya directive "use server" di baris
// paling atas, dan Next.js CUMA mengizinkan file "use server" meng-export
// async function, tidak boleh meng-export const/value biasa (itu yang bikin
// error build "Only async functions are allowed to be exported in a 'use
// server' file"). Constant-nya diimpor dari sana kalau dibutuhkan di sini.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Snap punya ID payment channel versinya sendiri (BEDA dari payment_type
// Core API yang dulu dipakai) buat parameter `enabled_payments`. Peta ini
// menyambungkan toggle admin (Dashboard > Settings > Metode Bayar, lihat
// libs/actions/paymentSettings.ts) ke ID yang dikenali Snap, supaya popup
// Snap hanya menampilkan metode yang lagi diaktifkan panitia.
const SNAP_ENABLED_PAYMENT_MAP: Record<PaymentMethodId, string> = {
  gopay: "gopay",
  qris: "other_qris",
  permata: "permata_va",
  mandiri: "echannel",
  bni: "bni_va",
  bri: "bri_va",
  bsi: "bsi_va",
};

export type PaymentSnapResult = {
  token: string;
  redirectUrl: string;
};

type CreatePaymentResult =
  | { ok: true; orderId: string; snap: PaymentSnapResult }
  | { ok: false; error: string };

// SATU-SATUNYA cara bikin transaksi sekarang: generate Snap token +
// redirect_url. Tidak ada lagi parameter `method` di sini — pemilihan
// GoPay/QRIS/VA/dll sekarang sepenuhnya ditangani di dalam popup Snap
// (lihat CheckoutClient.tsx -> window.snap.pay(token, ...)).
export async function createPaymentTransaction(
  registrationId: string,
): Promise<CreatePaymentResult> {
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

  // Jaga-jaga server-side: kalau semua metode lagi dinonaktifkan admin
  // lewat Settings > Metode Bayar, jangan sampai bikin transaksi Snap
  // dengan enabled_payments kosong (itu bikin popup Snap kosong tanpa
  // metode apa pun) — tolak dari sini duluan dengan pesan yang jelas.
  const enabledMethods = await getEnabledPaymentMethods();
  if (enabledMethods.length === 0) {
    return {
      ok: false,
      error:
        "Belum ada metode pembayaran yang aktif saat ini. Hubungi panitia lewat halaman Kontak ya.",
    };
  }
  const enabledPayments = enabledMethods.map(
    (id) => SNAP_ENABLED_PAYMENT_MAP[id],
  );

  // 🔍 DEBUG SEMENTARA — hapus lagi kalau GoPay sudah kekonfirmasi muncul.
  // Ini bakal nongol di terminal `npm run dev` (atau log server/Vercel di
  // production), BUKAN di console browser, karena ini server action.
  console.log("[DEBUG] enabledMethods dari DB:", enabledMethods);
  console.log("[DEBUG] enabledPayments dikirim ke Snap:", enabledPayments);

  // PROMO: gross_amount yang dikirim ke Midtrans WAJIB pakai final_amount
  // yang tersimpan di DB (sudah memperhitungkan promo kalau ada), BUKAN
  // dihitung ulang dari kategori.
  const grossAmount =
    registration.final_amount ?? getRegistrationFee(registration.kategori);
  const orderId = buildOrderId(registration.id);

  const paymentExpiresAt = new Date(
    Date.now() + PAYMENT_DURATION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Dipakai sebagai callbacks.finish Snap (halaman yang dituju setelah
  // pembayaran selesai/gagal/ditutup dari popup) DAN sebagai link di email
  // invoice/reminder — dua-duanya ngarahin balik ke halaman checkout kita.
  const finishUrl = `${APP_URL}/checkout/${registration.id}`;

  // ── SATU-SATUNYA network call yang WAJIB ditunggu sebelum popup Snap
  // bisa dibuka di frontend. Semua kerjaan LAIN (kirim email, tulis log)
  // tidak boleh ikut nge-block response ini -- makanya dipindah ke after()
  // di bawah, dijalankan SETELAH client sudah menerima token/redirect_url.
  let snapTransaction: MidtransSnapTransactionResponse;
  try {
    snapTransaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: registration.nama_lengkap,
        email: registration.email,
        phone: registration.telepon ?? undefined,
      },
      enabled_payments: enabledPayments,
      expiry: {
        unit: "hour",
        duration: PAYMENT_DURATION_HOURS,
      },
      callbacks: {
        finish: finishUrl,
      },
    });

    // 🔍 DEBUG SEMENTARA — cek juga respons mentahnya.
    console.log("[DEBUG] snapTransaction response:", snapTransaction);
  } catch (err) {
    console.error("Gagal membuat Snap transaction:", err);
    return { ok: false, error: "Gagal menghubungi Midtrans, coba lagi." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({
      status: "pending_payment",
      midtrans_order_id: orderId,
      midtrans_redirect_url: snapTransaction.redirect_url ?? finishUrl,
      payment_expires_at: paymentExpiresAt,
    })
    .eq("id", registrationId);

  if (updateError) {
    console.error("Gagal update data pembayaran:", updateError);
    return { ok: false, error: "Gagal menyimpan data pembayaran." };
  }

  // PENTING: dua kerjaan di bawah ini (log audit + email invoice) TIDAK
  // memengaruhi apa yang dilihat user (token Snap sudah fix dari respons
  // createTransaction() di atas), jadi tidak perlu di-`await` di jalur
  // utama. `after()` (Next.js) menjalankan callback ini SETELAH response
  // dikirim ke browser -- user langsung bisa buka popup Snap, tanpa nunggu
  // Resend/DB log.
  after(async () => {
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
            paymentUrl: finishUrl,
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
  });

  return {
    ok: true,
    orderId,
    snap: {
      token: snapTransaction.token,
      redirectUrl: snapTransaction.redirect_url,
    },
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

// Dipanggil dari CheckoutClient (polling otomatis + tombol "Cek status
// sekarang"). Kalau status di DB masih pending_payment, fungsi ini AKTIF
// nanya langsung ke Midtrans lewat endpoint Get Transaction Status Core API
// -- nggak cuma pasrah nunggu webhook yang mungkin gagal terkirim. Ini
// dipakai TERLEPAS dari transaksinya dibuat lewat Snap (sekarang) atau
// dulu Core API charge, karena endpoint status memang sama untuk keduanya.
export async function reconcilePaymentStatus(
  registrationId: string,
): Promise<ReconcileResult> {
  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select("id, status, midtrans_order_id, bib_number")
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    console.error("[reconcilePaymentStatus] registrasi tidak ditemukan:", error);
    return { status: null, bibNumber: null };
  }

  if (!registration.midtrans_order_id || registration.status !== "pending_payment") {
    return {
      status: registration.status as string,
      bibNumber: registration.bib_number as string | null,
    };
  }

  try {
    const midtransStatus = await coreApi.transaction.status(
      registration.midtrans_order_id,
    );

    const result = await applyTransactionStatus({
      orderId: midtransStatus.order_id,
      transactionStatus: midtransStatus.transaction_status,
      fraudStatus: midtransStatus.fraud_status,
      source: "reconcile",
      paymentType: midtransStatus.payment_type,
      grossAmount: midtransStatus.gross_amount,
    });

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