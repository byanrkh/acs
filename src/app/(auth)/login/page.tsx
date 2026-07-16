"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Email atau password salah.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDF6E9] px-6">
      <div className="w-full max-w-sm border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <span className="inline-block -rotate-2 border-4 border-black bg-[#FFD400] px-3 py-1 text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          ACS 2026 · Admin
        </span>
        <h1
          className={cn(
            SpecialGhotic.className,
            "mt-5 text-2xl uppercase tracking-tight",
          )}
        >
          Login Panitia
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-black/60",
              )}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-4 border-black bg-white px-3 py-2.5 text-sm outline-none focus:bg-[#FFF7DA]"
              placeholder="panitia@acs.id"
            />
          </div>

          <div>
            <label
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-black/60",
              )}
            >
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-4 border-black bg-white px-3 py-2.5 text-sm outline-none focus:bg-[#FFF7DA]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="border-2 border-[#D91E36] bg-[#D91E36]/10 px-3 py-2 text-xs font-bold text-[#D91E36]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? "Masuk..." : "Masuk"}
          </Button>
        </form>
      </div>
    </div>
  );
}
