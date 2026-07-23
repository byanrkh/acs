"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildTransferInvoiceEmailHtml } from "@/libs/email/transferInvoiceTemplate";
import { getRegistrationFee } from "@/libs/config/pricing";
import { UNIQUE_CODE_MAX } from "@/libs/config/bankTransfer";
import type { RegistrationPayload } from "@/libs/actions/registration";

// Ambil nomor urut berikutnya berdasarkan nomor_urut tertinggi yang sudah
// tersimpan, lalu diputar 1..UNIQUE_CODE_MAX. Catatan: kalau ada dua
// pendaftaran yang submit persis bersamaan, secara teori bisa dapat
// nomor urut yang sama (race condition ringan) — untuk volume pendaftaran
// event ini risikonya kecil, tapi kalau mau 100% aman bisa diganti pakai
// Postgres sequence/lock di masa depan.
async function getNextNomorUrut(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("nomor_urut")
    .not("nomor_urut", "is", null)
    .order("nomor_urut", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getNextNomorUrut] gagal ambil nomor urut terakhir:", error);
  }

  const last = data?.nomor_urut ?? 0;
  return (last % UNIQUE_CODE_MAX) + 1;
}

export async function submitTransferRegistration(
  data: RegistrationPayload,
  email: string,
): Promise<
  | { ok: true; registrationId: string; redirectPath: string }
  | { ok: false; error: string; field?: keyof RegistrationPayload }
> {
  const nomorUrut = await getNextNomorUrut();
  const grossAmount = getRegistrationFee(data.kategori) + nomorUrut;

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
      nomor_urut: nomorUrut,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "Data ini sepertinya sudah pernah didaftarkan." };
    }
    console.error("[submitTransferRegistration] gagal simpan registrasi:", insertError);
    return { ok: false, error: "Gagal menyimpan data, coba lagi." };
  }

  const registrationId = inserted.id as string;
  const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/transfer/${registrationId}`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Invoice pendaftaran ACS 2026 — Bayar ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(grossAmount)}`,
      html: buildTransferInvoiceEmailHtml({
        namaLengkap: data.namaLengkap.trim(),
        kategori: data.kategori,
        ukuranJersey: data.ukuranJersey,
        grossAmount,
        checkoutUrl,
      }),
    });
  } catch (emailError) {
    console.error("[submitTransferRegistration] gagal mengirim email invoice:", emailError);
  }

  return {
    ok: true,
    registrationId,
    redirectPath: `/checkout/transfer/${registrationId}`,
  };
}