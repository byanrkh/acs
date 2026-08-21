import { supabaseAdmin } from "@/libs/supabase/server";
import PageHeader from "@/components/dashboard/PageHeader";
import BroadcastComposer from "@/components/dashboard/BroadcastComposer";
import { BROADCAST_TEST_EMAILS } from "@/libs/config/broadcastTestEmails";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("email")
    .eq("status", "confirmed");

  const recipientCount = error
    ? 0
    : new Set((data ?? []).map((r) => r.email.trim().toLowerCase())).size;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Broadcast"
        title="Broadcast"
        description="Kirim pengumuman ke semua peserta yang statusnya sudah confirmed."
      />
      <BroadcastComposer
        recipientCount={recipientCount}
        testEmails={BROADCAST_TEST_EMAILS}
      />
    </div>
  );
}
