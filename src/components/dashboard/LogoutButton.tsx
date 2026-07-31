"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";
import { cn } from "@/libs/cn";

export default function LogoutButton({
  compact = false,
}: {
  compact?: boolean;
}) {
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

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        title="Keluar"
        aria-label="Keluar"
        className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M8 3H4.5A1.5 1.5 0 003 4.5v11A1.5 1.5 0 004.5 17H8M13 13.5L17.5 10 13 6.5M17 10H7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={cn(
        "w-full border-2 border-black bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50",
      )}
    >
      {isPending ? "..." : "Keluar"}
    </button>
  );
}
