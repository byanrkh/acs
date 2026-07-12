import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM ?? "ACS 2026 <onboarding@resend.dev>";

if (!apiKey) {
  throw new Error("RESEND_API_KEY belum diisi di .env.local");
}

export const resend = new Resend(apiKey);
export const EMAIL_FROM = fromEmail;