"use client";

import { cn } from "@/libs/cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import LogoutButton from "./LogoutButton";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

type IconProps = { className?: string };

function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="7" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M2 17c0-3 2.2-5 5-5s5 2 5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="14.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12.5 12.2c2.4.2 4 1.9 4.5 4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconScan({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M2 6V3.5A1.5 1.5 0 013.5 2H6M14 2h2.5A1.5 1.5 0 0118 3.5V6M18 14v2.5a1.5 1.5 0 01-1.5 1.5H14M6 18H3.5A1.5 1.5 0 012 16.5V14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="6.5"
        y="6.5"
        width="7"
        height="7"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconTransfer({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M3 7h12M11 3.5L15 7l-4 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 13H5M9 9.5L5 13l4 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
};

const navItems: NavItem[] = [
  { label: "Peserta", href: "/dashboard", icon: IconUsers },
  { label: "Scan", href: "/dashboard/scan", icon: IconScan },
  { label: "Transfer", href: "/dashboard/transfer", icon: IconTransfer },
];

const LOGO_URL =
  "https://cdn.quatrolympic.com/41028044-a720-48f0-b91c-74e271968c6e.png";

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Tutup drawer otomatis tiap kali pindah halaman.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll body + dukung tombol Escape selagi drawer mobile terbuka.
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

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Topbar mobile: cuma tampil di bawah breakpoint lg */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-4 border-black bg-[#FDF6E9] px-4 py-3 lg:hidden">
        <Link href="/" className="shrink-0">
          <Image
            src={LOGO_URL}
            alt="Logo ACS"
            width={36}
            height={36}
            priority
          />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu admin"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M2 5h16M2 10h16M2 15h16"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {/* Sidebar tetap (fixed) buat layar lg ke atas */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-4 border-black bg-[#FDF6E9] lg:flex">
        <SidebarContent
          isActive={isActive}
          userEmail={userEmail}
          onNavigate={() => {}}
        />
      </aside>

      {/* Overlay + drawer buat mobile/tablet */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu admin"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r-4 border-black bg-[#FDF6E9]",
          "shadow-[10px_0px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b-4 border-black px-5 py-4">
          <span
            className={cn(
              SpecialGhotic.className,
              "text-lg uppercase tracking-tight",
            )}
          >
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="flex h-10 w-10 items-center justify-center border-4 border-black bg-white"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <SidebarContent
          isActive={isActive}
          userEmail={userEmail}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </>
  );
}

function SidebarContent({
  isActive,
  userEmail,
  onNavigate,
}: {
  isActive: (href: string) => boolean;
  userEmail: string;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="hidden items-center gap-3 border-b-4 border-black px-5 py-5 lg:flex">
        <Link href="/" className="shrink-0">
          <Image
            src={LOGO_URL}
            alt="Logo ACS"
            width={40}
            height={40}
            priority
          />
        </Link>
        <span
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase leading-tight tracking-tight",
          )}
        >
          Admin
          <br />
          Dashboard
        </span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 border-2 px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-transform",
                active
                  ? "border-black bg-[#FF5A1F] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "border-transparent text-black hover:border-black hover:bg-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t-4 border-black px-4 py-4">
        <p
          className={cn(
            spaceMono.className,
            "truncate text-[11px] uppercase tracking-widest text-black/50",
          )}
        >
          {userEmail}
        </p>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
