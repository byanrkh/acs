"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { submitQrisRegistration } from "@/libs/actions/registrationQris";

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

  // 1) Cek email ganda
  const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (emailCheckError) {
    console.error("Gagal cek email ganda:", emailCheckError);
    return { ok: false, error: "Terjadi kesalahan server, coba lagi." };
  }
  if (existingEmail) {
    return { ok: false, error: "Email ini sudah terdaftar sebelumnya.", field: "email" };
  }

  // 2) Cek NISN/NIK ganda sesuai kategori
  if (data.kategori === "pelajar") {
    const { data: existingNisn, error: nisnCheckError } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("kategori", "pelajar")
      .eq("nisn", data.nisn)
      .maybeSingle();

    if (nisnCheckError) {
      console.error("Gagal cek NISN ganda:", nisnCheckError);
      return { ok: false, error: "Terjadi kesalahan server, coba lagi." };
    }
    if (existingNisn) {
      return { ok: false, error: "NISN ini sudah terdaftar sebelumnya.", field: "nisn" };
    }
  } else {
    const { data: existingNik, error: nikCheckError } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("kategori", "umum")
      .eq("nik_terakhir", data.nikTerakhir)
      .ilike("nama_lengkap", data.namaLengkap.trim())
      .maybeSingle();

    if (nikCheckError) {
      console.error("Gagal cek NIK ganda:", nikCheckError);
      return { ok: false, error: "Terjadi kesalahan server, coba lagi." };
    }
    if (existingNik) {
      return {
        ok: false,
        error: "Data dengan nama & NIK ini sudah terdaftar sebelumnya.",
        field: "nikTerakhir",
      };
    }
  }

  const paymentMethod = process.env.NEXT_PUBLIC_PAYMENT_METHOD ?? "MIDTRANS";
  if (paymentMethod === "QRIS_STATIS") {
    return submitQrisRegistration(data, email);
  }

  // 3) Simpan ke database dan ambil 'id' (UUID) baris baru
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
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "Data ini sepertinya sudah pernah didaftarkan." };
    }
    console.error("Gagal simpan registrasi:", insertError);
    return { ok: false, error: "Gagal menyimpan data, coba lagi." };
  }

  return { ok: true, registrationId: inserted.id as string };
}