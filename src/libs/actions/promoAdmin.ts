"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { logAuditEvent } from "@/libs/actions/logs";

export type PromoAdminRow = {
  id: string;
  code: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  max_uses: number;
  current_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type PromoFormInput = {
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  maxUses: number;
  startDate: string; // ISO string dari <input type="datetime-local">
  endDate: string;
  isActive: boolean;
};

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) {
    return null;
  }
  return admin;
}

function validatePromoForm(input: PromoFormInput): string | null {
  const code = input.code?.trim();
  if (!code) return "Kode promo wajib diisi.";
  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    return "Kode promo hanya boleh huruf, angka, strip, dan underscore.";
  }

  if (input.discountType !== "fixed" && input.discountType !== "percentage") {
    return "Tipe diskon tidak valid.";
  }

  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    return "Nilai diskon harus lebih dari 0.";
  }
  if (input.discountType === "percentage" && input.discountValue > 100) {
    return "Diskon persentase tidak boleh lebih dari 100%.";
  }

  if (!Number.isInteger(input.maxUses) || input.maxUses <= 0) {
    return "Kuota (Max Uses) harus bilangan bulat lebih dari 0.";
  }

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Tanggal mulai/berakhir tidak valid.";
  }
  if (end.getTime() <= start.getTime()) {
    return "Tanggal berakhir harus setelah tanggal mulai.";
  }

  return null;
}

export async function listPromos(): Promise<ActionResult<PromoAdminRow[]>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data, error } = await supabaseAdmin
    .from("promos")
    .select(
      "id, code, discount_type, discount_value, max_uses, current_uses, start_date, end_date, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listPromos] gagal ambil daftar promo:", error);
    return { ok: false, error: "Gagal memuat daftar promo." };
  }

  return { ok: true, data: data ?? [] };
}

export async function createPromo(
  input: PromoFormInput,
): Promise<ActionResult<PromoAdminRow>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const validationError = validatePromoForm(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const code = input.code.trim().toUpperCase();

  const { data, error } = await supabaseAdmin
    .from("promos")
    .insert({
      code,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      max_uses: input.maxUses,
      start_date: new Date(input.startDate).toISOString(),
      end_date: new Date(input.endDate).toISOString(),
      is_active: input.isActive,
    })
    .select(
      "id, code, discount_type, discount_value, max_uses, current_uses, start_date, end_date, is_active, created_at",
    )
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, error: `Kode promo "${code}" sudah dipakai.` };
    }
    console.error("[createPromo] gagal simpan promo:", error);
    return { ok: false, error: "Gagal menyimpan promo, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "create_promo",
    description: `Membuat kode promo "${data.code}" (${input.discountType === "percentage" ? `${input.discountValue}%` : `Rp${input.discountValue}`}, kuota ${input.maxUses})`,
    metadata: { promo_id: data.id, code: data.code },
  });

  return { ok: true, data };
}

export async function updatePromo(
  promoId: string,
  input: PromoFormInput,
): Promise<ActionResult<PromoAdminRow>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const validationError = validatePromoForm(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // Kuota (max_uses) tidak boleh diturunkan sampai di bawah pemakaian
  // yang sudah terjadi -- kalau dipaksa, current_uses > max_uses dan
  // melanggar CHECK constraint di DB (sengaja dibiarkan DB yang menolak
  // sebagai lapisan terakhir, tapi kita cek dulu di sini biar pesan
  // errornya jelas buat admin).
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("promos")
    .select("current_uses")
    .eq("id", promoId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Promo tidak ditemukan." };
  }

  if (input.maxUses < existing.current_uses) {
    return {
      ok: false,
      error: `Kuota tidak boleh diturunkan di bawah pemakaian saat ini (${existing.current_uses}).`,
    };
  }

  const code = input.code.trim().toUpperCase();

  const { data, error } = await supabaseAdmin
    .from("promos")
    .update({
      code,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      max_uses: input.maxUses,
      start_date: new Date(input.startDate).toISOString(),
      end_date: new Date(input.endDate).toISOString(),
      is_active: input.isActive,
    })
    .eq("id", promoId)
    .select(
      "id, code, discount_type, discount_value, max_uses, current_uses, start_date, end_date, is_active, created_at",
    )
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, error: `Kode promo "${code}" sudah dipakai.` };
    }
    console.error("[updatePromo] gagal update promo:", error);
    return { ok: false, error: "Gagal menyimpan perubahan, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "update_promo",
    description: `Mengubah kode promo "${data.code}"`,
    metadata: { promo_id: data.id, code: data.code },
  });

  return { ok: true, data };
}

export async function togglePromoActive(
  promoId: string,
  isActive: boolean,
): Promise<ActionResult<{ id: string; is_active: boolean }>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data, error } = await supabaseAdmin
    .from("promos")
    .update({ is_active: isActive })
    .eq("id", promoId)
    .select("id, code, is_active")
    .single();

  if (error || !data) {
    console.error("[togglePromoActive] gagal update status promo:", error);
    return { ok: false, error: "Gagal mengubah status promo." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "toggle_promo_active",
    description: `${isActive ? "Mengaktifkan" : "Menonaktifkan"} kode promo "${data.code}"`,
    metadata: { promo_id: data.id, code: data.code, is_active: isActive },
  });

  return { ok: true, data: { id: data.id, is_active: data.is_active } };
}

export async function deletePromo(
  promoId: string,
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("promos")
    .select("id, code")
    .eq("id", promoId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Promo tidak ditemukan." };
  }

  // Aman dihapus walau sudah pernah dipakai -- registrations.promo_id
  // pakai ON DELETE SET NULL, jadi data historis discount_amount /
  // final_amount di registrasi lama TETAP UTUH, cuma referensi ke baris
  // promos-nya yang hilang.
  const { error: deleteError } = await supabaseAdmin
    .from("promos")
    .delete()
    .eq("id", promoId);

  if (deleteError) {
    console.error("[deletePromo] gagal hapus promo:", deleteError);
    return { ok: false, error: "Gagal menghapus promo, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "delete_promo",
    description: `Menghapus kode promo "${existing.code}"`,
    metadata: { promo_id: existing.id, code: existing.code },
  });

  return { ok: true, data: { id: existing.id } };
}