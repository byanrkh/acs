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
  folder: string;
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
  folder: string;
};

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Indonesia gak pakai DST, jadi offset WIB selalu tetap +07:00.
const JAKARTA_OFFSET = "+07:00";

// <input type="datetime-local"> ngasih string TANPA timezone
// (contoh: "2026-08-14T23:59"). String kayak gitu, kalau langsung
// dilempar ke `new Date(...)`, bakal di-parse pakai timezone SERVER
// yang jalanin kode ini (Vercel = UTC) -- BUKAN timezone browser admin.
// Makanya dipaksa parse sebagai WIB dengan nempelin offset +07:00.
function parseJakartaDatetimeLocal(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}:00${JAKARTA_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "Folder" cuma path string biasa di kolom promos.folder -- gak ada tabel
// folder terpisah. Root selalu "/", folder lain ditulis "/nama" atau
// "/nama/sub". Fungsi ini yang jamin formatnya konsisten (selalu diawali
// "/", gak ada trailing slash selain root, spasi dirapikan).
function normalizeFolderPath(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed || trimmed === "/") return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

const FOLDER_PATTERN = /^\/[a-zA-Z0-9_\-/]*$/;

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

  const start = parseJakartaDatetimeLocal(input.startDate);
  const end = parseJakartaDatetimeLocal(input.endDate);
  if (!start || !end) {
    return "Tanggal mulai/berakhir tidak valid.";
  }
  if (end.getTime() <= start.getTime()) {
    return "Tanggal berakhir harus setelah tanggal mulai.";
  }

  if (!FOLDER_PATTERN.test(normalizeFolderPath(input.folder))) {
    return "Format folder tidak valid. Contoh yang benar: / atau /collab";
  }

  return null;
}

const PROMO_COLUMNS =
  "id, code, discount_type, discount_value, max_uses, current_uses, start_date, end_date, is_active, folder, created_at";

export async function listPromos(): Promise<ActionResult<PromoAdminRow[]>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data, error } = await supabaseAdmin
    .from("promos")
    .select(PROMO_COLUMNS)
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
  const startDate = parseJakartaDatetimeLocal(input.startDate)!;
  const endDate = parseJakartaDatetimeLocal(input.endDate)!;
  const folder = normalizeFolderPath(input.folder);

  const { data, error } = await supabaseAdmin
    .from("promos")
    .insert({
      code,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      max_uses: input.maxUses,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: input.isActive,
      folder,
    })
    .select(PROMO_COLUMNS)
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
    description: `Membuat kode promo "${data.code}" di folder "${folder}" (${input.discountType === "percentage" ? `${input.discountValue}%` : `Rp${input.discountValue}`}, kuota ${input.maxUses})`,
    metadata: { promo_id: data.id, code: data.code, folder },
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
  const startDate = parseJakartaDatetimeLocal(input.startDate)!;
  const endDate = parseJakartaDatetimeLocal(input.endDate)!;
  const folder = normalizeFolderPath(input.folder);

  const { data, error } = await supabaseAdmin
    .from("promos")
    .update({
      code,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      max_uses: input.maxUses,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: input.isActive,
      folder,
    })
    .eq("id", promoId)
    .select(PROMO_COLUMNS)
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

// Dipanggil dari tombol "Pindahkan" di tiap baris promo. Cuma ganti kolom
// folder -- gak nyentuh field lain, jadi aman dipanggil kapan pun tanpa
// perlu validasi form lengkap.
export async function movePromoToFolder(
  promoId: string,
  folder: string,
): Promise<ActionResult<{ id: string; folder: string }>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const normalized = normalizeFolderPath(folder);
  if (!FOLDER_PATTERN.test(normalized)) {
    return {
      ok: false,
      error: "Format folder tidak valid. Contoh yang benar: / atau /collab",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("promos")
    .update({ folder: normalized })
    .eq("id", promoId)
    .select("id, code, folder")
    .single();

  if (error || !data) {
    console.error("[movePromoToFolder] gagal pindahkan folder promo:", error);
    return { ok: false, error: "Gagal memindahkan promo, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: "move_promo_folder",
    description: `Memindahkan kode promo "${data.code}" ke folder "${normalized}"`,
    metadata: { promo_id: data.id, code: data.code, folder: normalized },
  });

  return { ok: true, data: { id: data.id, folder: data.folder } };
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