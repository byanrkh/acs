"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="border-2 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50"
    >
      {isPending ? "..." : "Keluar"}
    </button>
  );
}
