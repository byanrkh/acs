"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildTransferInvoiceEmailHtml } from "@/libs/email/transferInvoiceTemplate";
import { getRegistrationFee } from "@/libs/config/pricing";

// ============================================================
// TIPE
// ============================================================

type PromoRow = {
  id: string;
  code: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  max_uses: number;
  current_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

type RegistrationRow = {
  id: string;
  kategori: "pelajar" | "umum";
  status: string;
  nama_lengkap: string;
  email: string;
  ukuran_jersey: string;
  nomor_urut: number | null;
};

export type PromoCalculation = {
  promoId: string;
  code: string;
  discountAmount: number;
  finalAmount: number;
};

export type ValidatePromoResult =
  | ({ success: true; message: string } & PromoCalculation)
  | { success: false; error: string };

export type ApplyPromoResult =
  | ({ success: true; message: string } & PromoCalculation)
  | { success: false; error: string };

export type RemovePromoResult =
  | { success: true; finalAmount: number }
  | { success: false; error: string };

// Status pendaftaran yang sudah final / sedang diproses -> tidak boleh
// lagi mengubah promo (mencegah orang "diskon" transaksi yang sudah
// lunas atau sedang diverifikasi).
const LOCKED_STATUSES = new Set([
  "confirmed",
  "waiting_verification",
  "cancelled",
  "expired",
]);

// ============================================================
// KALKULASI DISKON (murni fungsi, tidak menyentuh DB)
// ============================================================

function calculateDiscount(
  promo: Pick<PromoRow, "discount_type" | "discount_value">,
  originalAmount: number,
): { discountAmount: number; finalAmount: number } {
  const rawDiscount =
    promo.discount_type === "percentage"
      ? Math.round((originalAmount * promo.discount_value) / 100)
      : promo.discount_value;

  // Diskon tidak boleh melebihi originalAmount, dan tidak boleh negatif.
  const discountAmount = Math.min(Math.max(rawDiscount, 0), originalAmount);
  const finalAmount = Math.max(originalAmount - discountAmount, 0);

  return { discountAmount, finalAmount };
}

// ============================================================
// PENCARIAN & VALIDASI PROMO DI DB
// ============================================================

async function findValidPromo(
  rawCode: string,
): Promise<{ ok: true; promo: PromoRow } | { ok: false; error: string }> {
  const code = (rawCode ?? "").trim().toUpperCase();

  if (!code) {
    return { ok: false, error: "Kode promo wajib diisi." };
  }

  const { data: promo, error } = await supabaseAdmin
    .from("promos")
    .select(
      "id, code, discount_type, discount_value, max_uses, current_uses, start_date, end_date, is_active",
    )
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[findValidPromo] gagal query promo:", error);
    return { ok: false, error: "Terjadi kesalahan server, coba lagi." };
  }

  if (!promo) {
    return { ok: false, error: "Kode promo tidak ditemukan." };
  }

  if (!promo.is_active) {
    return { ok: false, error: "Kode promo sudah tidak aktif." };
  }

  const now = Date.now();
  const start = new Date(promo.start_date).getTime();
  const end = new Date(promo.end_date).getTime();

  if (now < start || now > end) {
    return { ok: false, error: "Kode promo belum/sudah tidak berlaku." };
  }

  if (promo.current_uses >= promo.max_uses) {
    return { ok: false, error: "Mohon maaf, kuota kode promo ini telah habis." };
  }

  return { ok: true, promo };
}

// Validasi murni (read-only, tidak menyimpan apa pun). Dipakai juga
// sebagai langkah "re-validate" di dalam applyPromoToRegistration
// sebelum data disimpan ke registrations.
export async function validatePromoCode(
  rawCode: string,
  originalAmount: number,
): Promise<ValidatePromoResult> {
  if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
    return { success: false, error: "Nominal pembayaran tidak valid." };
  }

  const result = await findValidPromo(rawCode);
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  const { discountAmount, finalAmount } = calculateDiscount(
    result.promo,
    originalAmount,
  );

  return {
    success: true,
    promoId: result.promo.id,
    code: result.promo.code,
    discountAmount,
    finalAmount,
    message: `Kode promo "${result.promo.code}" berhasil dipakai.`,
  };
}

// ============================================================
// TERAPKAN / HAPUS PROMO KE REGISTRASI (dipanggil dari halaman checkout)
// ============================================================

async function fetchEditableRegistration(
  registrationId: string,
): Promise<{ ok: true; registration: RegistrationRow } | { ok: false; error: string }> {
  const { data: registration, error } = await supabaseAdmin
    .from("registrations")
    .select("id, kategori, status, nama_lengkap, email, ukuran_jersey, nomor_urut")
    .eq("id", registrationId)
    .single();

  if (error || !registration) {
    return { ok: false, error: "Data pendaftaran tidak ditemukan." };
  }

  if (LOCKED_STATUSES.has(registration.status)) {
    return {
      ok: false,
      error: `Pendaftaran ini sudah tidak bisa diubah (status saat ini: ${registration.status}).`,
    };
  }

  return { ok: true, registration: registration as RegistrationRow };
}

// Kirim ulang email invoice transfer bank dengan nominal terbaru, supaya
// email di inbox peserta tidak "basi" setelah promo diterapkan/dihapus.
// Best-effort -- gagal kirim email TIDAK boleh membatalkan penerapan promo.
async function resendTransferInvoiceIfPossible(
  registration: RegistrationRow,
  finalAmount: number,
) {
  try {
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/transfer/${registration.id}`;
    const grossAmount = finalAmount + (registration.nomor_urut ?? 0);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: registration.email,
      subject: `Invoice diperbarui — ACS 2026 (${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(grossAmount)})`,
      html: buildTransferInvoiceEmailHtml({
        namaLengkap: registration.nama_lengkap,
        kategori: registration.kategori,
        ukuranJersey: registration.ukuran_jersey,
        grossAmount,
        checkoutUrl,
      }),
    });
  } catch (emailError) {
    console.error(
      "[resendTransferInvoiceIfPossible] gagal kirim ulang invoice:",
      emailError,
    );
  }
}

// Dipanggil dari PromoInput.tsx di /checkout/[id] (channel "midtrans") dan
// /checkout/transfer/[id] (channel "transfer"). Re-validate sekali lagi di
// server sebelum menyimpan, mencegah bypass API lewat request manual.
export async function applyPromoToRegistration(
  registrationId: string,
  rawCode: string,
  channel: "midtrans" | "transfer",
): Promise<ApplyPromoResult> {
  const fetched = await fetchEditableRegistration(registrationId);
  if (!fetched.ok) {
    return { success: false, error: fetched.error };
  }

  const registration = fetched.registration;
  const originalAmount = getRegistrationFee(registration.kategori);

  const validation = await validatePromoCode(rawCode, originalAmount);
  if (!validation.success) {
    return validation;
  }

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({
      promo_id: validation.promoId,
      discount_amount: validation.discountAmount,
      final_amount: validation.finalAmount,
    })
    .eq("id", registrationId);

  if (updateError) {
    console.error("[applyPromoToRegistration] gagal update registrasi:", updateError);
    return { success: false, error: "Gagal menyimpan kode promo, coba lagi." };
  }

  if (channel === "transfer") {
    await resendTransferInvoiceIfPossible(registration, validation.finalAmount);
  }

  return validation;
}

// Dipanggil saat user klik "Hapus Promo" di PromoInput.tsx. Mengembalikan
// rincian harga ke nominal awal (tanpa diskon).
export async function removePromoFromRegistration(
  registrationId: string,
  channel: "midtrans" | "transfer",
): Promise<RemovePromoResult> {
  const fetched = await fetchEditableRegistration(registrationId);
  if (!fetched.ok) {
    return { success: false, error: fetched.error };
  }

  const registration = fetched.registration;
  const originalAmount = getRegistrationFee(registration.kategori);

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({ promo_id: null, discount_amount: 0, final_amount: originalAmount })
    .eq("id", registrationId);

  if (updateError) {
    console.error(
      "[removePromoFromRegistration] gagal update registrasi:",
      updateError,
    );
    return { success: false, error: "Gagal menghapus kode promo, coba lagi." };
  }

  if (channel === "transfer") {
    await resendTransferInvoiceIfPossible(registration, originalAmount);
  }

  return { success: true, finalAmount: originalAmount };
}

// ============================================================
// PEMOTONGAN KUOTA (dipanggil HANYA saat status pembayaran = LUNAS)
// ============================================================
// Dipanggil dari:
// - src/libs/midtrans/applyStatusUpdate.ts, tepat di titik transisi
//   status -> "confirmed" (baik dari webhook maupun reconcile).
// - src/libs/actions/transferAdmin.ts (approveTransferPayment), tepat
//   setelah admin approve bukti transfer.
//
// Best-effort & TIDAK PERNAH melempar error ke pemanggil: uang sudah
// diterima / transaksi sudah settlement di Midtrans, jadi status
// pembayaran WAJIB tetap dikonfirmasi walau increment kuota promo gagal
// (misalnya race condition ekstrem bikin kuota oversold 1 slot). Kalau
// itu terjadi, cukup dicatat di log server untuk ditinjau admin.
export async function incrementPromoUsageSafely(promoId: string | null) {
  if (!promoId) return;

  try {
    const { data, error } = await supabaseAdmin.rpc("increment_promo_usage", {
      p_promo_id: promoId,
    });

    if (error) {
      console.error(
        `[incrementPromoUsageSafely] gagal increment kuota promo ${promoId}:`,
        error,
      );
      return;
    }

    if (data === false) {
      console.warn(
        `[incrementPromoUsageSafely] kuota promo ${promoId} sudah penuh saat increment dijalankan (oversold ringan, transaksi tetap dikonfirmasi karena pembayaran sudah diterima).`,
      );
    }
  } catch (err) {
    console.error(
      `[incrementPromoUsageSafely] exception saat increment kuota promo ${promoId}:`,
      err,
    );
  }
}