"use server";

import { supabaseAdmin } from "@/libs/supabase/server";
import { CONFIRMED_REGISTRATION_QUOTA } from "@/libs/config/capacity";

export async function getConfirmedRegistrationCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");

  if (error) {
    console.error("[getConfirmedRegistrationCount] gagal hitung kuota:", error);
    return 0;
  }

  return count ?? 0;
}

export async function isRegistrationClosed(): Promise<boolean> {
  const confirmedCount = await getConfirmedRegistrationCount();
  return confirmedCount >= CONFIRMED_REGISTRATION_QUOTA;
}