import { redirect } from "next/navigation";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FDF6E9]">
      <Sidebar userEmail={user.email ?? ""} />

      {/* lg:ml-64 ngasih ruang buat sidebar yang fixed di desktop */}
      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
