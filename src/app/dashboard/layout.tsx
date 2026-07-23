import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import LogoutButton from "@/components/dashboard/LogoutButton";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FDF6E9]">
      <header className="sticky top-0 z-40 border-b-4 border-[#dfd2b9] bg-[#FDF6E9]">
        <div className="mx-auto block sm:flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="shrink-0">
            <Image
              src="https://cdn.quatrolympic.com/41028044-a720-48f0-b91c-74e271968c6e.png"
              alt="Logo ACS"
              width={48}
              height={48}
              priority
            />
          </Link>

          <nav className=" items-center gap-8 flex uppercase text-sm">
            <Link href="/dashboard" className="hover:text-[#FF5A1F]">
              Peserta
            </Link>
            <Link href="/dashboard/scan" className="hover:text-[#FF5A1F]">
              Scan
            </Link>
            <Link href="/dashboard/transfer" className="hover:text-[#FF5A1F]">
              Transfer
            </Link>
            <span className="hidden text-black/40 sm:inline">{user.email}</span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
