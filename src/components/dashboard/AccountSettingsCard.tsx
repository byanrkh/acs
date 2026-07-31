"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function AccountSettingsCard({
  userEmail,
}: {
  userEmail: string;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password baru minimal 8 karakter.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      setMessage({ type: "success", text: "Password berhasil diganti." });
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-4 border-black bg-[#A78BFA] px-4 py-3">
        <h2
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-black sm:text-base",
          )}
        >
          Akun Admin
        </h2>
      </div>

      <div className="p-5">
        <div className="mb-5 border-2 border-black/10 bg-[#FDF6E9] px-3 py-2">
          <p
            className={cn(
              spaceMono.className,
              "text-[9px] uppercase tracking-widest text-black/40",
            )}
          >
            Login sebagai
          </p>
          <p className="mt-0.5 text-sm font-bold">{userEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className={cn(
                spaceMono.className,
                "mb-1.5 block text-[10px] uppercase tracking-widest text-black/50",
              )}
            >
              Password Baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full border-4 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-[#FFF7DA]"
              required
            />
          </div>
          <div>
            <label
              className={cn(
                spaceMono.className,
                "mb-1.5 block text-[10px] uppercase tracking-widest text-black/50",
              )}
            >
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full border-4 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-[#FFF7DA]"
              required
            />
          </div>

          {message && (
            <p
              className={cn(
                spaceMono.className,
                "text-xs font-bold",
                message.type === "success" ? "text-[#1F4B33]" : "text-[#D91E36]",
              )}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              SpecialGhotic.className,
              "border-4 border-black bg-black px-4 py-2.5 text-xs uppercase tracking-tight text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50",
            )}
          >
            {isPending ? "Menyimpan..." : "Ganti Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
