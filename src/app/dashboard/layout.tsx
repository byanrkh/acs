import { redirect } from "next/navigation";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { supabaseAdmin } from "@/libs/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  const { count } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true });

  const { count: pendingTransferCount } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "waiting_verification");

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      initialParticipantCount={count ?? 0}
      initialPendingTransferCount={pendingTransferCount ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
