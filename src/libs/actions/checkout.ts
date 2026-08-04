"use server";

import { after } from "next/server";
import { supabaseAdmin } from "@/libs/supabase/server";
import { coreApi } from "@/libs/midtrans/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildInvoiceEmailHtml } from "@/libs/email/invoiceTemplate";
import { getRegistrationFee } from "@/libs/config/pricing";
import { buildOrderId } from "@/libs/midtrans/orderId";
import { applyTransactionStatus } from "@/libs/midtrans/applyStatusUpdate";
import { logPaymentEvent } from "@/libs/actions/logs";
import type { MidtransChargeResponse } from "midtrans-client";

const PAYMENT_DURATION_HOURS = 24;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Metode pembayaran yang kita tawarkan lewat Core API. Tinggal tambah entri
// di sini (+ mapping di buildChargePayload) kalau mau nambah metode baru,
// misal Mandiri Bill Payment atau GoPay.
export type PaymentMethod = "bca" | "bni" | "bri" | "permata" | "qris";

export type PaymentDisplay =
  | { kind: "va"; bank: string; vaNumber: string; expiresAt: string }
  | { kind: "qris"; qrImageUrl: string; expiresAt: string };

type CreatePaymentResult =
  | { ok: true; orderId: string; display: PaymentDisplay }
  | { ok: false; error: string };

function buildChargePayload({
  method,
  orderId,
  grossAmount,
  namaLengkap,
  email,
  telepon,
}: {
  method: PaymentMethod;
  orderId: string;
  grossAmount: number;
  namaLengkap: string;
  email: string;
  telepon?: string | null;
}) {
  const base = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    customer_details: {
      first_name: namaLengkap,
      email,
      phone: telepon ?? undefined,
    },
    custom_expiry: {
      expiry_duration: PAYMENT_DURATION_HOURS,
      unit: "hour" as const,
    },
  };

  switch (method) {
    case "bca":
    case "bni":
    case "bri":
      return {
        ...base,
        payment_type: "bank_transfer" as const,
        bank_transfer: { bank: method },
      };
    case "permata":
      return {
        ...base,
        payment_type: "permata" as const,
      };
    case "qris":
      return {
        ...base,
        payment_type: "qris" as const,
        qris: { acquirer: "gopay" as const },
      };
  }
}

// Ubah response mentah Core API jadi bentuk yang gampang dirender di UI.
// Setiap payment_type balikin bentuk response yang beda-beda (va_numbers
// array buat BCA/BNI/BRI, permata_va_number buat Permata, actions[] buat
// QRIS) -- semua perbedaan itu diserap di sini, jadi komponen client cuma
// perlu tahu 2 bentuk: "va" atau "qris".
function extractPaymentDisplay(
  charge: MidtransChargeResponse,
): PaymentDisplay | null {
  const expiresAt = charge.expiry_time
    ? new Date(charge.expiry_time.replace(" ", "T")).toISOString()
    : new Date(Date.now() + PAYMENT_DURATION_HOURS * 60 * 60 * 1000).toISOString();

  if (charge.payment_type === "bank_transfer" && charge.va_numbers?.length) {
    const va = charge.va_numbers[0];
    return { kind: "va", bank: va.bank, vaNumber: va.va_number, expiresAt };
  }

  if (charge.payment_type === "permata" && charge.permata_va_number) {
    return {
      kind: "va",
      bank: "permata",
      vaNumber: charge.permata_va_number,
      expiresAt,
    };
  }

  if (charge.payment_type === "qris") {
    const qrAction = charge.actions?.find((a) => a.name === "generate-qr-code");
    if (qrAction?.url) {
      return { kind: "qris", qrImageUrl: qrAction.url, expiresAt };
    }
  }

  return null;
}

export async function createPaymentTransaction(
  registrationId: string,
  method: PaymentMethod,
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

  // PROMO: gross_amount yang dikirim ke Midtrans WAJIB pakai final_amount
  // yang tersimpan di DB (sudah memperhitungkan promo kalau ada), BUKAN
  // dihitung ulang dari kategori.
  const grossAmount =
    registration.final_amount ?? getRegistrationFee(registration.kategori);
  const orderId = buildOrderId(registration.id);

  const paymentExpiresAt = new Date(
    Date.now() + PAYMENT_DURATION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Nggak ada lagi halaman hosted Midtrans buat "finish redirect" karena kita
  // gak pakai Snap. Link ini cuma dipakai di email (invoice/reminder) supaya
  // user diarahkan balik ke halaman checkout kita sendiri.
  const finishUrl = `${APP_URL}/checkout/${registration.id}`;

  // ── SATU-SATUNYA network call yang WAJIB ditunggu sebelum user bisa
  // lihat nomor VA / QRIS-nya. Ini murni waktu tempuh ke server Midtrans,
  // biasanya <1-2 detik. Semua kerjaan LAIN (kirim email, tulis log) tidak
  // boleh ikut nge-block response ini -- makanya dipindah ke after() di
  // bawah, dijalankan SETELAH client sudah menerima jawaban.
  let charge: MidtransChargeResponse;
  try {
    charge = await coreApi.charge(
      buildChargePayload({
        method,
        orderId,
        grossAmount,
        namaLengkap: registration.nama_lengkap,
        email: registration.email,
        telepon: registration.telepon,
      }),
    );
  } catch (err) {
    console.error("Gagal membuat Core API transaction:", err);
    return { ok: false, error: "Gagal menghubungi Midtrans, coba lagi." };
  }

  if (charge.transaction_status === "deny") {
    return { ok: false, error: "Transaksi ditolak oleh Midtrans, coba metode lain." };
  }

  const display = extractPaymentDisplay(charge);
  if (!display) {
    console.error("[createPaymentTransaction] respons Midtrans tidak dikenali:", charge);
    return { ok: false, error: "Format respons pembayaran tidak dikenali, coba lagi." };
  }

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({
      status: "pending_payment",
      midtrans_order_id: orderId,
      midtrans_redirect_url: finishUrl,
      payment_expires_at: paymentExpiresAt,
    })
    .eq("id", registrationId);

  if (updateError) {
    console.error("Gagal update data pembayaran:", updateError);
    return { ok: false, error: "Gagal menyimpan data pembayaran." };
  }

  // PENTING: dua kerjaan di bawah ini (log audit + email invoice) TIDAK
  // memengaruhi apa yang dilihat user (nomor VA/QRIS sudah fix dari respons
  // charge() di atas), jadi tidak perlu di-`await` di jalur utama. `after()`
  // (Next.js) menjalankan callback ini SETELAH response dikirim ke browser
  // -- user langsung lihat kode pembayarannya, tanpa nunggu Resend/DB log.
  after(async () => {
    await logPaymentEvent({
      registrationId: registration.id,
      orderId,
      source: "checkout",
      statusApplied: "pending_payment",
      paymentType: charge.payment_type,
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

  return { ok: true, orderId, display };
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
// nanya langsung ke Midtrans lewat Core API -- nggak cuma pasrah nunggu
// webhook yang mungkin gagal terkirim.
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