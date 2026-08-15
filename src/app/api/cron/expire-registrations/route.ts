import { NextRequest, NextResponse } from "next/server";
import { expireAllPastDeadlineRegistrations } from "@/libs/actions/expiration";

// Endpoint ini dipanggil scheduler eksternal (Vercel Cron / cron-job.org /
// dst) secara berkala (disarankan tiap 5 menit) buat men-sweep SEMUA
// registrasi channel Midtrans yang statusnya masih "pending_payment" tapi
// payment_expires_at-nya sudah lewat -- ini jalur server-side/database yang
// TIDAK bergantung sama sekali pada peserta membuka halaman checkout-nya
// (beda dari checkAndExpireIfPastDeadline yang cuma jalan lazy per-registrasi
// pas halaman checkout dibuka).
//
// Diamankan pakai CRON_SECRET: request WAJIB bawa header
// `Authorization: Bearer <CRON_SECRET>` yang cocok sama env var di server,
// supaya endpoint ini tidak bisa dipicu sembarang orang buat nge-spam
// query/email. Kalau deploy di Vercel dan CRON_SECRET sudah diisi di
// Project Settings -> Environment Variables, Vercel Cron OTOMATIS mengirim
// header ini sendiri (lihat vercel.json).
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(
      "[cron/expire-registrations] CRON_SECRET belum diisi di environment.",
    );
    return NextResponse.json(
      { message: "CRON_SECRET belum dikonfigurasi di server." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await expireAllPastDeadlineRegistrations();

  console.log(
    `[cron/expire-registrations] selesai -> expired: ${result.expiredCount}, gagal: ${result.failedIds.length}`,
  );

  return NextResponse.json({
    status: "OK",
    expiredCount: result.expiredCount,
    failedIds: result.failedIds,
  });
}