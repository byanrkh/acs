// Info kontak dipakai bareng di Footer & halaman /contact, biar cuma
// perlu diedit di satu tempat kalau ada perubahan nomor/email/dll.
export const CONTACT_INFO = {
  email: "acs.projectalkp4@gmail.com",
  // Format internasional tanpa spasi/simbol, contoh: "6281234567890".
  // Selama masih "-" tombol WhatsApp di halaman contact otomatis disembunyikan.
  whatsapp: "0811258200",
  instagram: "@acs.projectid",
  instagramUrl: "https://instagram.com/acs.projectid",
  address: "Kompleks SMAI Al Azhar 4, Kemang Pratama",
};

export function whatsappHref(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}