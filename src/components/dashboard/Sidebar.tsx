"use client";

import { cn } from "@/libs/cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import LogoutButton from "./LogoutButton";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";

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

function IconTag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M11 2.5H8.2c-.5 0-1 .2-1.3.6L2.6 7.4c-.6.6-.6 1.6 0 2.2l7.8 7.8c.6.6 1.6.6 2.2 0l4.3-4.3c.6-.6.6-1.6 0-2.2l-7.8-7.8a1.9 1.9 0 00-.1-.6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="6.7" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10 2.6v2M10 15.4v2M17.4 10h-2M4.6 10h-2M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4M15.2 15.2l-1.4-1.4M6.2 6.2L4.8 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevron({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M12.5 4L7 10l5.5 6"
        stroke="currentColor"
        strokeWidth="2"
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
  activeBg: string;
  activeText: string;
  dot: string;
};

const navItems: NavItem[] = [
  {
    label: "Peserta",
    href: "/dashboard",
    icon: IconUsers,
    activeBg: "bg-[#FF5A1F]",
    activeText: "text-white",
    dot: "bg-[#FF5A1F]",
  },
  {
    label: "Verifikasi Transfer",
    href: "/dashboard/transfer",
    icon: IconTransfer,
    activeBg: "bg-[#3B82F6]",
    activeText: "text-white",
    dot: "bg-[#3B82F6]",
  },
  {
    label: "Promo",
    href: "/dashboard/promo",
    icon: IconTag,
    activeBg: "bg-[#7ED957]",
    activeText: "text-black",
    dot: "bg-[#7ED957]",
  },
  {
    label: "Scan",
    href: "/dashboard/scan",
    icon: IconScan,
    activeBg: "bg-[#FFD400]",
    activeText: "text-black",
    dot: "bg-[#FFD400]",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: IconSettings,
    activeBg: "bg-[#A78BFA]",
    activeText: "text-black",
    dot: "bg-[#A78BFA]",
  },
];

const LOGO_URL =
  "https://cdn.quatrolympic.com/41028044-a720-48f0-b91c-74e271968c6e.png";

export default function Sidebar({
  userEmail,
  initialParticipantCount,
  collapsed,
  onToggleCollapsed,
}: {
  userEmail: string;
  initialParticipantCount: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [participantCount, setParticipantCount] = useState(
    initialParticipantCount,
  );

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

  // Counter "Total Peserta" di footer sidebar tetap live walaupun admin lagi
  // buka halaman lain (Scan, Settings, dll) yang ga nampilin tabel peserta.
  // Channel-nya sengaja dipisah dari tabel data peserta biar ringan (cuma
  // dengerin INSERT/DELETE, ga perlu payload penuh).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("sidebar-participant-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrations" },
        () => setParticipantCount((c) => c + 1),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "registrations" },
        () => setParticipantCount((c) => Math.max(0, c - 1)),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Topbar mobile: cuma tampil di bawah breakpoint lg */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-4 border-[#dfd2b9] bg-[#FDF6E9] px-4 py-3 lg:hidden">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src={LOGO_URL}
            alt="Logo ACS"
            width={36}
            height={36}
            priority
          />
          <span
            className={cn(
              SpecialGhotic.className,
              "text-sm uppercase tracking-tight",
            )}
          >
            Admin
          </span>
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

      {/* Sidebar tetap (fixed) buat layar lg ke atas, bisa di-collapse */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r-4 border-[#dfd2b9] bg-[#FDF6E9] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <SidebarContent
          isActive={isActive}
          userEmail={userEmail}
          participantCount={participantCount}
          onNavigate={() => {}}
          collapsed={collapsed}
        />

        {/* Tombol collapse/expand — cuma di desktop */}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          className="absolute -right-4 top-20 flex h-8 w-8 items-center justify-center border-4 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
        >
          <IconChevron
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
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
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r-4 border-[#dfd2b9] bg-[#FDF6E9]",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b-4 border-[#dfd2b9] px-5 py-4">
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
          participantCount={participantCount}
          onNavigate={() => setOpen(false)}
          collapsed={false}
        />
      </div>
    </>
  );
}

function SidebarContent({
  isActive,
  userEmail,
  participantCount,
  onNavigate,
  collapsed,
}: {
  isActive: (href: string) => boolean;
  userEmail: string;
  participantCount: number;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD";

  return (
    <>
      <div
        className={cn(
          "hidden items-center gap-3 border-b-4 border-[#dfd2b9] px-5 py-5 lg:flex",
          collapsed && "justify-center px-3",
        )}
      >
        <Link href="/" className="relative shrink-0">
          <Image
            src={LOGO_URL}
            alt="Logo ACS"
            width={40}
            height={40}
            priority
          />
        </Link>
        {!collapsed && (
          <span
            className={cn(
              SpecialGhotic.className,
              "text-sm uppercase leading-tight tracking-tight",
            )}
          >
            ACS
          </span>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 space-y-2 overflow-y-auto px-4 py-5",
          collapsed && "px-3",
        )}
      >
        {navItems.map(
          ({ label, href, icon: Icon, activeBg, activeText, dot }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "group flex items-center gap-3 border-2 px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-all",
                  collapsed && "justify-center px-0",
                  active
                    ? cn(
                        "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        activeBg,
                        activeText,
                      )
                    : "border-transparent text-black hover:translate-x-0.5 hover:border-black hover:bg-white",
                )}
              >
                <span className="relative shrink-0">
                  <Icon className="h-5 w-5" />
                  {!active && (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full border border-black opacity-0 transition-opacity group-hover:opacity-100",
                        dot,
                      )}
                    />
                  )}
                </span>
                {!collapsed && label}
              </Link>
            );
          },
        )}
      </nav>

      <div
        className={cn(
          "border-t-4 border-[#dfd2b9] px-4 py-4",
          collapsed && "px-3",
        )}
      >
        {!collapsed && (
          <div className="mb-3 flex items-center justify-between border-2 border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span
              className={cn(
                spaceMono.className,
                "text-[9px] uppercase tracking-widest text-black/50",
              )}
            >
              Total Peserta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className={cn(SpecialGhotic.className, "text-sm")}>
                {participantCount}
              </span>
            </span>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2.5",
            collapsed && "flex-col gap-3",
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#FFD400]",
              spaceMono.className,
              "text-[10px] font-bold",
            )}
            title={userEmail}
          >
            {initials}
          </div>
          {!collapsed && (
            <p
              className={cn(
                spaceMono.className,
                "min-w-0 flex-1 truncate text-[10px] uppercase tracking-widest text-black/50",
              )}
            >
              {userEmail}
            </p>
          )}
        </div>

        <div className={cn("mt-3", collapsed && "flex justify-center")}>
          <LogoutButton compact={collapsed} />
        </div>
      </div>
    </>
  );
}
