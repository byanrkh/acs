"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { resend, EMAIL_FROM } from "@/libs/email/resend";
import { buildBroadcastEmailHtml } from "@/libs/email/broadcastTemplate";
import { logAuditEvent } from "@/libs/actions/logs";
import { BROADCAST_TEST_EMAILS } from "@/libs/config/broadcastTestEmails";

export type BroadcastPayload = {
  subject: string;
  message: string;
};

export type BroadcastResult =
  | { ok: true; sent: number; failed: number }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
// Resend batch API nerima maksimal 100 email per request -- kita kirim
// per-batch (bukan satu-satu) biar broadcast ke ratusan peserta nggak
// bikin function timeout.
const BATCH_SIZE = 100;

function validatePayload(payload: BroadcastPayload): string | null {
  if (!payload.subject?.trim()) return "Subjek broadcast wajib diisi.";
  if (payload.subject.trim().length > 150) return "Subjek maksimal 150 karakter.";
  if (!payload.message?.trim()) return "Isi pesan wajib diisi.";
  return null;
}

type EmailJob = { to: string; subject: string; html: string };

async function dispatchInBatches(
  jobs: EmailJob[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const chunk = jobs.slice(i, i + BATCH_SIZE).map((job) => ({
      from: EMAIL_FROM,
      to: job.to,
      subject: job.subject,
      html: job.html,
    }));

    try {
      const { error } = await resend.batch.send(chunk);
      if (error) {
        console.error("[broadcast] batch gagal terkirim:", error);
        failed += chunk.length;
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      console.error("[broadcast] batch exception:", err);
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

// Dipanggil dari halaman /dashboard/broadcast waktu admin milih mode "Test
// Broadcast" di dropdown. Email tujuan SELALU diambil dari
// BROADCAST_TEST_EMAILS (config), bukan input manual -- jadi admin bisa
// klik test berkali-kali tanpa ngetik ulang, dan bisa dites lagi kapan aja
// (termasuk setelah broadcast asli udah pernah dikirim). Subjek otomatis
// dikasih prefix "[TEST]" dan body dikasih badge merah biar nggak ketuker
// sama broadcast beneran.
export async function sendTestBroadcast(
  payload: BroadcastPayload,
): Promise<BroadcastResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const validationError = validatePayload(payload);
  if (validationError) return { ok: false, error: validationError };

  const cleanEmails = Array.from(
    new Set(
      BROADCAST_TEST_EMAILS.map((e) => e.trim().toLowerCase()).filter(
        Boolean,
      ),
    ),
  );

  if (cleanEmails.length === 0) {
    return {
      ok: false,
      error: "BROADCAST_TEST_EMAILS di config masih kosong, isi dulu.",
    };
  }
  const invalidEmail = cleanEmails.find((e) => !EMAIL_PATTERN.test(e));
  if (invalidEmail) {
    return {
      ok: false,
      error: `Ada email test yang formatnya salah di config: ${invalidEmail}`,
    };
  }

  const html = buildBroadcastEmailHtml({
    namaLengkap: "Kak Peserta",
    message: payload.message,
    isTest: true,
  });

  const jobs: EmailJob[] = cleanEmails.map((to) => ({
    to,
    subject: `[TEST] ${payload.subject.trim()}`,
    html,
  }));

  const { sent, failed } = await dispatchInBatches(jobs);

  await logAuditEvent({
    actorEmail: admin.email,
    action: "broadcast_test",
    description: `Kirim test broadcast "${payload.subject.trim()}" ke ${cleanEmails.length} email`,
    metadata: {
      subject: payload.subject.trim(),
      test_emails: cleanEmails,
      sent,
      failed,
    },
  });

  if (sent === 0) {
    return { ok: false, error: "Gagal mengirim test broadcast, coba lagi." };
  }

  return { ok: true, sent, failed };
}

// Broadcast beneran ke SEMUA peserta berstatus "confirmed". Dedupe by
// email dulu -- satu email bisa dipakai lebih dari sekali daftar, tapi
// cukup dapet 1 broadcast aja. Nama di sapaan diambil dari pendaftaran
// pertama yang ketemu buat email tsb.
export async function sendBroadcast(
  payload: BroadcastPayload,
): Promise<BroadcastResult> {
  const admin = await getAdminUser();
  if (!admin) {
    return { ok: false, error: "Sesi login sudah habis, silakan login ulang." };
  }

  const validationError = validatePayload(payload);
  if (validationError) return { ok: false, error: validationError };

  const { data: registrations, error } = await supabaseAdmin
    .from("registrations")
    .select("email, nama_lengkap")
    .eq("status", "confirmed");

  if (error) {
    console.error("[sendBroadcast] gagal ambil data peserta:", error);
    return { ok: false, error: "Gagal mengambil data peserta." };
  }

  const recipientMap = new Map<string, string>();
  for (const r of registrations ?? []) {
    const email = r.email.trim().toLowerCase();
    if (!recipientMap.has(email)) {
      recipientMap.set(email, r.nama_lengkap);
    }
  }

  if (recipientMap.size === 0) {
    return { ok: false, error: "Tidak ada peserta dengan status confirmed." };
  }

  const jobs: EmailJob[] = Array.from(recipientMap.entries()).map(
    ([to, namaLengkap]) => ({
      to,
      subject: payload.subject.trim(),
      html: buildBroadcastEmailHtml({
        namaLengkap,
        message: payload.message,
        isTest: false,
      }),
    }),
  );

  const { sent, failed } = await dispatchInBatches(jobs);

  await logAuditEvent({
    actorEmail: admin.email,
    action: "broadcast_sent",
    description: `Kirim broadcast "${payload.subject.trim()}" ke ${recipientMap.size} peserta confirmed (berhasil ${sent}, gagal ${failed})`,
    metadata: {
      subject: payload.subject.trim(),
      total_recipients: recipientMap.size,
      sent,
      failed,
    },
  });

  if (sent === 0) {
    return { ok: false, error: "Gagal mengirim broadcast ke semua penerima, coba lagi." };
  }

  return { ok: true, sent, failed };
}