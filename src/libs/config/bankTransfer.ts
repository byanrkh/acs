export const UNIQUE_CODE_MAX = 900;

// Info rekening bank tujuan transfer. Diisi lewat environment variable
// (server-side, TANPA prefix NEXT_PUBLIC_ biar nggak ikut ke bundle client):
//   BANK_NAME=Bank Central Asia (BCA)
//   BANK_ACCOUNT_NUMBER=1234567890
//   BANK_ACCOUNT_HOLDER=Nama Pemilik Rekening
export const BANK_TRANSFER_INFO = {
  bankName: process.env.BANK_NAME ?? "Bank Syariah Indonesia (BSI)",
  accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? "7365562215",
  accountHolder: process.env.BANK_ACCOUNT_HOLDER ?? "FITRI MAHARIS",
};