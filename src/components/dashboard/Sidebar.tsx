"use client";

import { cn } from "@/libs/cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import Marquee from "react-fast-marquee";
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

function IconChevronDouble({ className }: IconProps) {
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

// Baris toggle collapse/expand — sengaja jadi bagian dari alur sidebar (bukan
// floating di tepi), biar ga pernah nabrak/nutupin item nav lain pas collapsed.
function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
      className={cn(
        "group flex w-full items-center gap-2 border-b-4 border-black bg-white px-4 py-2.5 transition-colors hover:bg-[#FFD400]",
        collapsed && "justify-center px-0",
      )}
    >
      <IconChevronDouble
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-transform duration-300",
          collapsed && "rotate-180",
        )}
      />
      {!collapsed && (
        <span
          className={cn(
            spaceMono.className,
            "text-[9px] uppercase tracking-widest text-black/50 group-hover:text-black",
          )}
        >
          Minimize Sidebar
        </span>
      )}
    </button>
  );
}

type NavItem = {
  label: string;
  shortLabel: string;
  href: string;
  icon: ComponentType<IconProps>;
  activeBg: string;
  activeText: string;
  dot: string;
};

const navItems: NavItem[] = [
  {
    label: "Peserta",
    shortLabel: "Data peserta lomba",
    href: "/dashboard",
    icon: IconUsers,
    activeBg: "bg-[#FF5A1F]",
    activeText: "text-white",
    dot: "bg-[#FF5A1F]",
  },
  {
    label: "Verifikasi Transfer",
    shortLabel: "Cek bukti transfer manual",
    href: "/dashboard/transfer",
    icon: IconTransfer,
    activeBg: "bg-[#3B82F6]",
    activeText: "text-white",
    dot: "bg-[#3B82F6]",
  },
  {
    label: "Promo",
    shortLabel: "Kode diskon & voucher",
    href: "/dashboard/promo",
    icon: IconTag,
    activeBg: "bg-[#7ED957]",
    activeText: "text-black",
    dot: "bg-[#7ED957]",
  },
  {
    label: "Scan",
    shortLabel: "Scan tiket di venue",
    href: "/dashboard/scan",
    icon: IconScan,
    activeBg: "bg-[#FFD400]",
    activeText: "text-black",
    dot: "bg-[#FFD400]",
  },
  {
    label: "Settings",
    shortLabel: "Pengaturan & log aktivitas",
    href: "/dashboard/settings",
    icon: IconSettings,
    activeBg: "bg-[#A78BFA]",
    activeText: "text-black",
    dot: "bg-[#A78BFA]",
  },
];

const LOGO_URL =
  "https://cdn.quatrolympic.com/41028044-a720-48f0-b91c-74e271968c6e.png";

const RACE_DATE = new Date("2026-08-23T06:00:00+07:00").getTime();

function useDaysToRace() {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    function update() {
      const diff = RACE_DATE - Date.now();
      setDays(diff > 0 ? Math.ceil(diff / 86_400_000) : 0);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return days;
}

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
  const daysToRace = useDaysToRace();

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
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-4 border-black bg-[#FDF6E9] px-4 py-3 lg:hidden">
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
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r-4 border-black bg-[#FDF6E9] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex",
          collapsed ? "w-20" : "w-72",
        )}
      >
        <SidebarContent
          isActive={isActive}
          userEmail={userEmail}
          participantCount={participantCount}
          daysToRace={daysToRace}
          onNavigate={() => {}}
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
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
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
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
          participantCount={participantCount}
          daysToRace={daysToRace}
          onNavigate={() => setOpen(false)}
          collapsed={false}
        />
      </div>
    </>
  );
}

// Pola titik-titik halus di header, biar ada tekstur tanpa ganggu keterbacaan.
function DotPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
    >
      <defs>
        <pattern
          id="sidebar-dots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.5" cy="1.5" r="1.5" fill="black" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sidebar-dots)" />
    </svg>
  );
}

function SidebarContent({
  isActive,
  userEmail,
  participantCount,
  daysToRace,
  onNavigate,
  collapsed,
  onToggleCollapsed,
}: {
  isActive: (href: string) => boolean;
  userEmail: string;
  participantCount: number;
  daysToRace: number | null;
  onNavigate: () => void;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
}) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD";

  return (
    <>
      {/* Header / brand strip */}
      <div
        className={cn(
          "relative hidden overflow-hidden border-b-4 border-black bg-[#FFF7DA] px-5 py-5 lg:flex lg:flex-col lg:gap-3",
          collapsed && "items-center px-3",
        )}
      >
        <DotPattern />
        <div className="relative flex items-center gap-3">
          <Link
            href="/"
            className="relative shrink-0 border-2 border-black bg-white p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Image
              src={LOGO_URL}
              alt="Logo ACS"
              width={collapsed ? 28 : 34}
              height={collapsed ? 28 : 34}
              priority
            />
          </Link>
          {!collapsed && (
            <div className="min-w-0">
              <span
                className={cn(
                  SpecialGhotic.className,
                  "block text-base uppercase leading-none tracking-tight",
                )}
              >
                ACS 2026
              </span>
              <span
                className={cn(
                  spaceMono.className,
                  "mt-1 block text-[9px] uppercase tracking-widest text-black/50",
                )}
              >
                Panel Panitia
              </span>
            </div>
          )}
        </div>
      </div>

      {onToggleCollapsed && (
        <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
      )}

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 space-y-2.5 overflow-y-auto px-4 py-5",
          collapsed && "px-3",
        )}
      >
        {navItems.map(
          (
            { label, shortLabel, href, icon: Icon, activeBg, activeText, dot },
            index,
          ) => {
            const active = isActive(href);
            const num = String(index + 1).padStart(2, "0");

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden border-2 px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-150",
                  collapsed && "justify-center px-0",
                  active
                    ? cn(
                        "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        activeBg,
                        activeText,
                      )
                    : "border-black/10 text-black hover:-translate-y-0.5 hover:border-black hover:bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                )}
              >
                {/* Notch "robek tiket" di pojok kiri item aktif */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-2 border-black bg-[#FDF6E9]"
                  />
                )}

                {!collapsed && (
                  <span
                    className={cn(
                      spaceMono.className,
                      "shrink-0 text-[9px] opacity-40 transition-opacity group-hover:opacity-70",
                      active && "!opacity-70",
                    )}
                  >
                    {num}
                  </span>
                )}

                <span className="relative shrink-0">
                  <Icon className="h-5 w-5 transition-transform duration-150 group-hover:scale-110" />
                  {!active && (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full border border-black opacity-0 transition-opacity group-hover:opacity-100",
                        dot,
                      )}
                    />
                  )}
                </span>

                {!collapsed && <span className="truncate">{label}</span>}

                {/* Tooltip pas collapsed */}
                {collapsed && (
                  <span
                    className={cn(
                      spaceMono.className,
                      "pointer-events-none absolute left-full ml-3 z-40 whitespace-nowrap border-2 border-black bg-black px-2.5 py-1.5 text-[10px] normal-case tracking-normal text-white opacity-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-opacity duration-150 group-hover:opacity-100",
                    )}
                  >
                    <span className="block font-bold uppercase tracking-widest text-[#FFD400]">
                      {label}
                    </span>
                    <span className="block text-white/70">{shortLabel}</span>
                  </span>
                )}
              </Link>
            );
          },
        )}
      </nav>

      {/* Footer */}
      <div
        className={cn("border-t-4 border-black px-4 py-4", collapsed && "px-3")}
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

        {/* Kartu identitas admin, gaya "ID badge" */}
        <div
          className={cn(
            "relative flex items-center gap-2.5 border-2 border-black bg-white px-2.5 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            collapsed && "flex-col gap-2 px-1.5 py-2.5",
          )}
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full w-1.5 bg-[#FFD400]"
          />
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#FFD400] -rotate-3",
              spaceMono.className,
              "text-[10px] font-bold",
            )}
            title={userEmail}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  spaceMono.className,
                  "truncate text-[10px] uppercase tracking-widest text-black",
                )}
                title={userEmail}
              >
                {userEmail}
              </p>
              <p
                className={cn(
                  spaceMono.className,
                  "text-[8px] uppercase tracking-widest text-black/40",
                )}
              >
                Admin · Panitia
              </p>
            </div>
          )}
        </div>

        <div className={cn("mt-3", collapsed && "flex justify-center")}>
          <LogoutButton compact={collapsed} />
        </div>
      </div>
    </>
  );
}
