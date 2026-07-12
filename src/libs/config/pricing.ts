export const REGISTRATION_FEE = {
  pelajar: 2_000,
  umum: 200_000,
} as const;

export function getRegistrationFee(kategori: "pelajar" | "umum") {
  return REGISTRATION_FEE[kategori];
}