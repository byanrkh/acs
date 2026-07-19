export const REGISTRATION_FEE = {
  pelajar: 200_000,
  umum: 225_000,
} as const;

export function getRegistrationFee(kategori: "pelajar" | "umum") {
  return REGISTRATION_FEE[kategori];
}