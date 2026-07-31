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

  // Cuma butuh count-nya buat badge live di sidebar, jadi pakai head:true
  // (ga narik data barisnya sama sekali, query super ringan).
  const { count } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true });

  return (
    <DashboardShell
      userEmail={user.email ?? ""}
      initialParticipantCount={count ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
