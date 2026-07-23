"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "@/libs/r2/client";
import { supabaseAdmin } from "@/libs/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadBuktiResult = { ok: true } | { ok: false; error: string };

export async function uploadBuktiTransfer(
  registrationId: string,
  formData: FormData,
): Promise<UploadBuktiResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, error: "File tidak ditemukan." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Format file harus JPG, PNG, atau WEBP." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "Ukuran file maksimal 5MB." };
  }

  const { data: registration, error: fetchError } = await supabaseAdmin
    .from("registrations")
    .select("id, status")
    .eq("id", registrationId)
    .single();

  if (fetchError || !registration) {
    return { ok: false, error: "Data pendaftaran tidak ditemukan." };
  }
  if (registration.status === "confirmed") {
    return { ok: false, error: "Pendaftaran ini sudah terkonfirmasi." };
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `resi-${registrationId}-${Date.now()}.${ext}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
      }),
    );
  } catch (err) {
    console.error("[uploadBuktiTransfer] gagal upload ke R2:", err);
    return { ok: false, error: "Gagal mengunggah bukti transfer, coba lagi." };
  }

  const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicBaseUrl) {
    console.error("[uploadBuktiTransfer] R2_PUBLIC_URL belum diset.");
    return { ok: false, error: "Konfigurasi server belum lengkap (R2_PUBLIC_URL)." };
  }
  const publicUrl = `${publicBaseUrl}/${key}`;

  const { error: updateError } = await supabaseAdmin
    .from("registrations")
    .update({ bukti_transfer: publicUrl, status: "waiting_verification" })
    .eq("id", registrationId);

  if (updateError) {
    console.error("[uploadBuktiTransfer] gagal update DB:", updateError);
    return {
      ok: false,
      error: "Bukti sudah terunggah, tapi gagal menyimpan ke database. Hubungi panitia.",
    };
  }

  return { ok: true };
}