"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { logAuditEvent } from "@/libs/actions/logs";

// Semua metode pembayaran yang didukung aplikasi ini lewat Midtrans Core
// API. Nambah metode baru? Tinggal tambah id-nya di sini + metadata di
// PAYMENT_METHOD_META, lalu tambah mapping charge-nya di
// libs/actions/checkout.ts (buildChargePayload & extractPaymentDisplay).
// PENTING: file ini punya "use server" di atas, artinya Next.js CUMA
// mengizinkan export berupa async function. Konstanta di bawah (array &
// object biasa) SENGAJA tidak di-export supaya nggak melanggar aturan itu
// -- kalau butuh dipakai di luar file ini, bungkus lewat fungsi async
// (lihat getPaymentMethodSettingsAdmin di bawah yang sudah begitu).
const PAYMENT_METHOD_IDS = [
  "gopay",
  "qris",
  "permata",
  "mandiri",
  "bni",
  "bri",
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export type PaymentMethodMeta = {
  id: PaymentMethodId;
  label: string;
  shortLabel: string;
  group: "instan" | "va";
};

const PAYMENT_METHOD_META: Record<PaymentMethodId, PaymentMethodMeta> = {
  gopay: { id: "gopay", label: "GoPay", shortLabel: "GoPay", group: "instan" },
  qris: { id: "qris", label: "QRIS", shortLabel: "QRIS", group: "instan" },
  permata: {
    id: "permata",
    label: "Permata Virtual Account",
    shortLabel: "Permata",
    group: "va",
  },
  mandiri: {
    id: "mandiri",
    label: "Mandiri Virtual Account",
    shortLabel: "Mandiri",
    group: "va",
  },
  bni: {
    id: "bni",
    label: "BNI Virtual Account",
    shortLabel: "BNI",
    group: "va",
  },
  bri: {
    id: "bri",
    label: "BRI Virtual Account",
    shortLabel: "BRI",
    group: "va",
  },
};

// Default kalau baris di DB belum ada (misal tabelnya baru dibikin dan
// belum pernah di-toggle dari Settings sama sekali). QRIS sengaja default
// OFF karena belum diaktifkan di akun Midtrans kita -- nyalain dari
// Dashboard > Settings > Metode Bayar begitu Midtrans sudah approve.
const DEFAULT_ENABLED: Record<PaymentMethodId, boolean> = {
  gopay: true,
  qris: false,
  permata: true,
  mandiri: true,
  bni: true,
  bri: true,
};

async function getPaymentMethodSettingsMap(): Promise<
  Record<PaymentMethodId, boolean>
> {
  const map = { ...DEFAULT_ENABLED };

  const { data, error } = await supabaseAdmin
    .from("payment_method_settings")
    .select("method, enabled");

  if (error) {
    // Tabel belum ada / query gagal -> fallback ke default di atas,
    // daripada bikin halaman checkout ikutan error karena settings doang.
    console.error(
      "[getPaymentMethodSettingsMap] gagal ambil settings, pakai default:",
      error,
    );
    return map;
  }

  for (const row of data ?? []) {
    if ((PAYMENT_METHOD_IDS as readonly string[]).includes(row.method)) {
      map[row.method as PaymentMethodId] = row.enabled;
    }
  }

  return map;
}

// Dipanggil dari halaman checkout (server component) buat tau metode mana
// yang lagi AKTIF ditawarkan ke peserta. Publik -- tidak butuh login admin.
export async function getEnabledPaymentMethods(): Promise<PaymentMethodId[]> {
  const settings = await getPaymentMethodSettingsMap();
  return PAYMENT_METHOD_IDS.filter((id) => settings[id]);
}

// Dipakai internal oleh createPaymentTransaction (checkout.ts) buat jaga
// server-side -- supaya metode yang lagi di-nonaktifkan di Settings tetap
// nggak bisa "dipaksa" lewat pemanggilan action langsung, walaupun
// tombolnya di UI checkout sudah disembunyikan/di-disable.
export async function isPaymentMethodEnabled(
  method: PaymentMethodId,
): Promise<boolean> {
  const settings = await getPaymentMethodSettingsMap();
  return settings[method] ?? false;
}

export type PaymentMethodAdminRow = PaymentMethodMeta & {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

// Dipanggil dari Settings > tab Metode Bayar. Butuh login admin, dan
// balikin SEMUA metode (aktif maupun nonaktif) lengkap sama metadata biar
// UI-nya bisa render switch buat masing-masing.
export async function getPaymentMethodSettingsAdmin(): Promise<
  { ok: true; data: PaymentMethodAdminRow[] } | { ok: false; error: string }
> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const { data, error } = await supabaseAdmin
    .from("payment_method_settings")
    .select("method, enabled, updated_at, updated_by");

  if (error) {
    console.error(
      "[getPaymentMethodSettingsAdmin] gagal ambil settings:",
      error,
    );
  }

  const byId = new Map(
    (data ?? []).map((row) => [row.method as PaymentMethodId, row]),
  );

  const result: PaymentMethodAdminRow[] = PAYMENT_METHOD_IDS.map((id) => {
    const row = byId.get(id);
    return {
      ...PAYMENT_METHOD_META[id],
      enabled: row ? row.enabled : DEFAULT_ENABLED[id],
      updatedAt: row?.updated_at ?? null,
      updatedBy: row?.updated_by ?? null,
    };
  });

  return { ok: true, data: result };
}

// Dipanggil dari switch di Settings. Upsert biar aman dipanggil pertama
// kali walau baris method tsb belum pernah ada di tabel sama sekali.
export async function setPaymentMethodEnabled(
  method: PaymentMethodId,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  if (!(PAYMENT_METHOD_IDS as readonly string[]).includes(method)) {
    return { ok: false, error: "Metode pembayaran tidak dikenali." };
  }

  const { error } = await supabaseAdmin.from("payment_method_settings").upsert(
    {
      method,
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: admin.email,
    },
    { onConflict: "method" },
  );

  if (error) {
    console.error("[setPaymentMethodEnabled] gagal update settings:", error);
    return { ok: false, error: "Gagal menyimpan pengaturan, coba lagi." };
  }

  await logAuditEvent({
    actorEmail: admin.email,
    action: enabled ? "payment_method_enabled" : "payment_method_disabled",
    description: `${enabled ? "Mengaktifkan" : "Menonaktifkan"} metode pembayaran ${PAYMENT_METHOD_META[method].label}`,
    metadata: { method, enabled },
  });

  return { ok: true };
}