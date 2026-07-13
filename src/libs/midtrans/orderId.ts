import "server-only";

// Semua order_id yang dikirim ke Midtrans WAJIB lewat sini, supaya formatnya
// konsisten dan bisa di-parse balik ke registrationId pas notifikasi masuk.
//
// PENTING: Midtrans membatasi order_id MAKSIMAL 50 KARAKTER. Karena itu:
// - Tanda "-" di UUID registrationId dibuang (36 karakter → 32 karakter).
// - Timestamp di-encode ke base36 (13 digit desimal → ~8 karakter).
//
// Format hasil akhir: ACS-<UUID tanpa dash, 32 karakter>-<timestamp base36>
// Contoh: ACS-82eba1288fab4b208b40b26b7d005d33-lz3k9f2a  (~45 karakter, aman)

const PREFIX = "ACS";
const COMPACT_UUID_LENGTH = 32;
const COMPACT_UUID_PATTERN = /^[0-9a-f]{32}$/i;

export function buildOrderId(registrationId: string): string {
  const compactId = registrationId.replace(/-/g, "");
  const compactTimestamp = Date.now().toString(36);

  const orderId = `${PREFIX}-${compactId}-${compactTimestamp}`;

  // Pengaman ekstra saat development — kalau suatu saat PREFIX diganti jadi
  // lebih panjang dan bikin total kepanjangan lagi, ini bakal ketauan cepat
  // lewat log, bukan nunggu error 400 dari Midtrans pas production.
  if (orderId.length > 50) {
    console.warn(`order_id melebihi 50 karakter (${orderId.length}): ${orderId}`);
  }

  return orderId;
}

export function parseOrderId(orderId: string): { registrationId: string } | null {
  if (typeof orderId !== "string" || !orderId.startsWith(`${PREFIX}-`)) {
    return null;
  }

  const rest = orderId.slice(PREFIX.length + 1);
  const compactId = rest.slice(0, COMPACT_UUID_LENGTH);

  if (!COMPACT_UUID_PATTERN.test(compactId)) {
    return null;
  }

  // Susun ulang jadi format UUID standar (8-4-4-4-12) biar bisa dipakai
  // langsung buat query kolom `id` (tipe uuid) di Supabase.
  const registrationId = [
    compactId.slice(0, 8),
    compactId.slice(8, 12),
    compactId.slice(12, 16),
    compactId.slice(16, 20),
    compactId.slice(20, 32),
  ].join("-");

  return { registrationId };
}