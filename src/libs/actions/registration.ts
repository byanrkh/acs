"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { submitTransferRegistration } from "@/libs/actions/registrationTransfer";
import { getRegistrationFee } from "@/libs/config/pricing";

export type RegistrationPayload = {
  kategori: "pelajar" | "umum";
  nisn?: string;
  nikTerakhir?: string;
  namaLengkap: string;
  email: string;
  telepon: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  golonganDarah: string;
  riwayatPenyakit?: string;
  kontakDaruratNama: string;
  kontakDaruratTelepon: string;
  ukuranJersey: string;
  namaBib: string;
};

export type RegistrationResult =
  | { ok: true; registrationId: string; redirectPath?: string }
  | { ok: false; error: string; field?: keyof RegistrationPayload };

// CATATAN PERUBAHAN: dulu di sini ada pengecekan "sudah pernah daftar belum"
// berdasarkan email (unik) dan NISN/NIK (unik per kategori). Sekarang
// sengaja DIHAPUS karena satu email / NISN / nomor HP boleh dipakai untuk
// lebih dari satu kali pendaftaran (misal: satu orang tua daftarin lebih
// dari satu anak pakai email yang sama, atau kakak-adik satu NISN keluarga,
// dsb). Validasi yang tersisa di bawah ini HANYA validasi format, bukan
// validasi keunikan/duplikat.
function validatePayload(data: RegistrationPayload): RegistrationResult | null {
  if (!data.namaLengkap?.trim()) {
    return { ok: false, error: "Nama lengkap wajib diisi.", field: "namaLengkap" };
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email ?? "")) {
    return { ok: false, error: "Format email tidak valid.", field: "email" };
  }
  if (data.kategori === "pelajar" && !/^\d{10}$/.test(data.nisn ?? "")) {
    return { ok: false, error: "NISN wajib 10 digit angka.", field: "nisn" };
  }
  if (data.kategori === "umum" && !/^\d{4}$/.test(data.nikTerakhir ?? "")) {
    return { ok: false, error: "4 digit terakhir NIK tidak valid.", field: "nikTerakhir" };
  }
  if ((data.namaBib ?? "").length > 12) {
    return { ok: false, error: "Nama di BIB maksimal 12 karakter.", field: "namaBib" };
  }
  return null;
}

export async function submitRegistration(
  data: RegistrationPayload
): Promise<RegistrationResult> {
  const validationError = validatePayload(data);
  if (validationError) return validationError;

  const email = data.email.trim().toLowerCase();

  const paymentMethod = process.env.NEXT_PUBLIC_PAYMENT_METHOD ?? "MIDTRANS";
  if (paymentMethod === "BANK_TRANSFER") {
    return submitTransferRegistration(data, email);
  }

  // PROMO: baseline final_amount = tarif dasar (belum ada diskon).
  // Promo baru diterapkan nanti di halaman /checkout/[id] lewat
  // applyPromoToRegistration, yang akan meng-update kolom ini.
  const baseAmount = getRegistrationFee(data.kategori);

  // Simpan ke database dan ambil 'id' (UUID) baris baru. Tidak ada lagi cek
  // "sudah terdaftar sebelumnya" di sini — email/NISN/NIK/telepon yang sama
  // boleh dipakai berkali-kali, tiap submit selalu bikin baris baru.
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("registrations")
    .insert({
      kategori: data.kategori,
      nisn: data.kategori === "pelajar" ? data.nisn : null,
      nik_terakhir: data.kategori === "umum" ? data.nikTerakhir : null,
      nama_lengkap: data.namaLengkap.trim(),
      email,
      telepon: data.telepon.trim(),
      tempat_lahir: data.tempatLahir.trim(),
      tanggal_lahir: data.tanggalLahir,
      jenis_kelamin: data.jenisKelamin,
      golongan_darah: data.golonganDarah,
      riwayat_penyakit: data.riwayatPenyakit?.trim() || null,
      kontak_darurat_nama: data.kontakDaruratNama.trim(),
      kontak_darurat_telepon: data.kontakDaruratTelepon.trim(),
      ukuran_jersey: data.ukuranJersey,
      nama_bib: data.namaBib.trim(),
      status: "pending_payment",
      promo_id: null,
      discount_amount: 0,
      final_amount: baseAmount,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      // Kalau ini masih ke-trigger, artinya masih ada UNIQUE constraint di
      // level database (kolom email/nisn/telepon) yang belum dilepas.
      // Cek/lepas constraint-nya langsung di Supabase (Table Editor ->
      // registrations -> kolom terkait -> hapus "Unique" constraint),
      // karena ini bukan lagi dicegah dari sisi kode.
      return {
        ok: false,
        error:
          "Data ini masih dianggap duplikat oleh database. Cek constraint UNIQUE di tabel registrations (kolom email/nisn/telepon) di Supabase.",
      };
    }
    console.error("Gagal simpan registrasi:", insertError);
    return { ok: false, error: "Gagal menyimpan data, coba lagi." };
  }

  return { ok: true, registrationId: inserted.id as string };
}