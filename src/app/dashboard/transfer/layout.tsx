import { redirect } from "next/navigation";
import { getAdminUser } from "@/libs/supabase/serverAuth";
import { SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default async function VerifikasiTransferLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#FDF6E9]">
      <header className="border-b-4 border-[#dfd2b9] bg-[#FDF6E9] px-6 py-4">
        <h1
          className={cn(
            SpecialGhotic.className,
            "text-lg uppercase tracking-tight text-black",
          )}
        >
          Verifikasi Transfer Bank
        </h1>
        <p className="text-xs text-black/50">{user.email}</p>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
