"use client";

import { cn } from "@/libs/cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "./Button";

const links = [
  { label: "Home", path: "/" },
  { label: "Information", path: "/information" },
  { label: "Documentation", path: "/documentation" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Tutup drawer otomatis tiap ganti halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Kunci scroll body selagi drawer terbuka + bisa ditutup pakai Escape
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink bg-sand">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="shrink-0">
          <Image
            src="https://cdn.quatrolympic.com/41028044-a720-48f0-b91c-74e271968c6e.png"
            alt="Logo ACS"
            width={48}
            height={48}
            priority
          />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.path}>
                <Link
                  href={l.path}
                  className={cn(
                    "text-sm font-medium uppercase tracking-tight transition-colors hover:text-ember",
                    pathname === l.path ? "text-ember" : "text-ink"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Button href="/registration" size="sm">
            Daftar
          </Button>
        </nav>

        {/* Tombol hamburger — mobile only */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center border-4 border-ink bg-white shadow-brutal-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M2 5h16M2 10h16M2 15h16"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-ink/50 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer, meluncur dari bawah */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t-4 border-ink bg-sand px-6 pb-8 pt-6",
          "shadow-brutal-lg transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-lg uppercase tracking-tight">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="flex h-10 w-10 items-center justify-center border-4 border-ink bg-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <ul className="mt-6 divide-y-2 divide-ink/10">
          {links.map((l) => (
            <li key={l.path}>
              <Link
                href={l.path}
                className={cn(
                  "block py-4 font-display text-2xl uppercase tracking-tight",
                  pathname === l.path ? "text-ember" : "text-ink"
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <Button href="/registration" className="mt-6 w-full justify-center">
          Daftar sekarang
        </Button>
      </div>
    </header>
  );
}
