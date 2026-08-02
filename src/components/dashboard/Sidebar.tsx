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

// Easing dipakai konsisten di semua transisi collapse biar berasa satu "gerakan",
// bukan potongan-potongan animasi yang beda timing.
const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";
const DUR = "duration-300";

// Href item nav yang butuh badge live jumlah "menunggu verifikasi". Kalau
// suatu saat ada item lain yang butuh badge serupa, tinggal tambah key di sini.
const PENDING_BADGE_HREF = "/dashboard/transfer";

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

// Badge lonceng notifikasi kecil di pojok ikon — nempel di ikon "Verifikasi
// Transfer" kalau ada pendaftar yang lagi nunggu verifikasi bukti transfer.
// Sengaja nempel di ikon (bukan di label), jadi tetap kelihatan walau
// sidebar lagi di-collapse.
function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-black bg-[#D91E36] px-1">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D91E36] opacity-60" />
      <span
        className={cn(
          spaceMono.className,
          "relative text-[9px] font-bold leading-none text-white",
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
}

// Wrapper generik buat "collapse" horizontal yang mulus: konten TETAP di-mount
// (ga di-unmount kayak sebelumnya), cuma max-width & opacity-nya yang dianimasikan.
// Ini yang bikin transisi collapse ga lagi kaku/pop begitu aja.
function CollapseInline({
  collapsed,
  className,
  maxWidth = "12rem",
  gapLeft,
  children,
}: {
  collapsed: boolean;
  className?: string;
  maxWidth?: string;
  // Margin-kiri dipisah dari `className` dan dipasang lewat inline style,
  // BUKAN sebagai kelas Tailwind. Ini disengaja: cn() di project ini pakai
  // tailwind-merge, jadi kalau margin ikut dioper lewat `className`,
  // tailwind-merge akan selalu menang-mengangkan kelas yang dioper dari
  // pemanggil di atas kelas "ml-0" bawaan komponen ini — margin-nya jadi
  // "hantu" yang tetap kepake walau lagi collapsed (lebar 0), dan itu yang
  // bikin ikon di sidebar collapsed kelihatan ga presisi di tengah.
  gapLeft?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin-left] ease-[cubic-bezier(0.16,1,0.3,1)]",
        DUR,
        collapsed ? "opacity-0" : "opacity-100",
        className,
      )}
      style={{
        maxWidth: collapsed ? "0px" : maxWidth,
        marginLeft: collapsed ? "0px" : (gapLeft ?? "0px"),
      }}
    >
      {children}
    </div>
  );
}

// Wrapper buat "collapse" vertikal (blok yang seharusnya hilang total & bikin
// elemen di bawahnya naik) pakai trik grid-template-rows 0fr -> 1fr, jauh lebih
// mulus dibanding conditional mount/unmount karena height-nya nyata dianimasikan.
function CollapseBlock({
  collapsed,
  className,
  children,
}: {
  collapsed: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,margin-bottom,opacity] ease-[cubic-bezier(0.16,1,0.3,1)]",
        DUR,
        collapsed
          ? "mb-0 grid-rows-[0fr] opacity-0"
          : "mb-3 grid-rows-[1fr] opacity-100",
        className,
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
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
        "group flex w-full items-center border-b-4 border-black bg-white transition-[padding] hover:bg-[#FFD400]",
        DUR,
        EASE,
        collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-4 py-2.5",
      )}
    >
      <IconChevronDouble
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-transform",
          DUR,
          collapsed && "rotate-180",
        )}
      />
      <CollapseInline collapsed={collapsed} maxWidth="10rem">
        <span
          className={cn(
            spaceMono.className,
            "text-[9px] uppercase tracking-widest text-black/50 group-hover:text-black",
          )}
        >
          Minimize Sidebar
        </span>
      </CollapseInline>
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
  initialPendingTransferCount,
  collapsed,
  onToggleCollapsed,
}: {
  userEmail: string;
  initialParticipantCount: number;
  initialPendingTransferCount: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [participantCount, setParticipantCount] = useState(
    initialParticipantCount,
  );
  const [pendingTransferCount, setPendingTransferCount] = useState(
    initialPendingTransferCount,
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

  // Badge "menunggu verifikasi" di item nav Transfer — beda dari counter
  // peserta di atas, di sini kita butuh REFETCH count-nya (bukan cuma
  // increment/decrement), karena perubahan yang relevan adalah pergantian
  // STATUS baris yang sudah ada (pending_payment → waiting_verification saat
  // peserta upload bukti, lalu waiting_verification → confirmed saat admin
  // approve) — bukan cuma insert/delete baris baru. Query count-nya sendiri
  // ringan (head:true, cuma hitung, ga narik data).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function refetchPendingTransferCount() {
      const { count } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("status", "waiting_verification");

      if (typeof count === "number") {
        setPendingTransferCount(count);
      }
    }

    const channel = supabase
      .channel("sidebar-pending-transfer-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        () => {
          refetchPendingTransferCount();
        },
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
          className="relative flex h-11 w-11 items-center justify-center border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
          <NavBadge count={pendingTransferCount} />
        </button>
      </header>

      {/* Sidebar tetap (fixed) buat layar lg ke atas, bisa di-collapse */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r-4 border-black bg-[#FDF6E9] transition-[width]",
          DUR,
          EASE,
          "lg:flex",
          collapsed ? "w-20" : "w-72",
        )}
      >
        <SidebarContent
          isActive={isActive}
          userEmail={userEmail}
          participantCount={participantCount}
          pendingTransferCount={pendingTransferCount}
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
          pendingTransferCount={pendingTransferCount}
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
  pendingTransferCount,
  daysToRace,
  onNavigate,
  collapsed,
  onToggleCollapsed,
}: {
  isActive: (href: string) => boolean;
  userEmail: string;
  participantCount: number;
  pendingTransferCount: number;
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
          "relative hidden overflow-hidden border-b-4 border-black bg-[#FFF7DA] transition-[padding]",
          DUR,
          EASE,
          "lg:flex lg:flex-col lg:gap-3",
          collapsed ? "items-center px-3 py-5" : "px-5 py-5",
        )}
      >
        <DotPattern />
        <div className="relative flex items-center gap-3">
          <Link
            href="/"
            className="relative shrink-0 border-2 border-black bg-white p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300"
          >
            <Image
              src={LOGO_URL}
              alt="Logo ACS"
              width={34}
              height={34}
              priority
              className={cn(
                "transition-[width,height] duration-300",
                collapsed && "h-7 w-7",
              )}
            />
          </Link>
          <CollapseInline
            collapsed={collapsed}
            maxWidth="10rem"
            className="min-w-0"
          >
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
          </CollapseInline>
        </div>

        {/* Badge H-hari, dekat lomba — muncul di kedua state (bentuknya beda) */}
        {daysToRace !== null && (
          <div
            className={cn(
              "relative border-2 border-black bg-[#FF5A1F] text-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
              DUR,
              EASE,
              collapsed ? "mt-1 px-1.5 py-1" : "self-start px-2.5 py-1",
            )}
          >
            <span
              className={cn(
                spaceMono.className,
                "block text-[9px] font-bold uppercase tracking-widest",
              )}
            >
              {collapsed
                ? `H-${daysToRace}`
                : `H-${daysToRace} menuju race day`}
            </span>
          </div>
        )}
      </div>

      {onToggleCollapsed && (
        <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
      )}

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 space-y-2.5 overflow-y-auto py-5 transition-[padding]",
          DUR,
          EASE,
          collapsed ? "px-3" : "px-4",
        )}
      >
        {navItems.map(
          (
            { label, shortLabel, href, icon: Icon, activeBg, activeText, dot },
            index,
          ) => {
            const active = isActive(href);
            const num = String(index + 1).padStart(2, "0");
            const badgeCount =
              href === PENDING_BADGE_HREF ? pendingTransferCount : 0;

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center border-2 py-2.5 text-sm font-bold uppercase tracking-wide transition-all",
                  DUR,
                  EASE,
                  collapsed ? "justify-center px-0" : "px-3",
                  active
                    ? cn(
                        "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                        activeBg,
                        activeText,
                      )
                    : "border-black/10 text-black hover:-translate-y-0.5 hover:border-black hover:bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                )}
              >
                {/* Notch "robek tiket" di pojok kiri item aktif — sekarang selalu
                    ter-mount, cuma opacity-nya yang ditransisikan biar ga "kedip". */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-2 border-black bg-[#FDF6E9] transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />

                <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                  <Icon className="h-5 w-5 transition-transform duration-150 group-hover:scale-110" />
                  {badgeCount > 0 ? (
                    <NavBadge count={badgeCount} />
                  ) : (
                    !active && (
                      <span
                        className={cn(
                          "absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full border border-black opacity-0 transition-opacity group-hover:opacity-100",
                          dot,
                        )}
                      />
                    )
                  )}
                </span>

                <CollapseInline
                  collapsed={collapsed}
                  maxWidth="12rem"
                  gapLeft="0.75rem"
                  className="flex items-center gap-2"
                >
                  <span
                    className={cn(
                      spaceMono.className,
                      "shrink-0 text-[9px] opacity-40 transition-opacity group-hover:opacity-70",
                      active && "!opacity-70",
                    )}
                  >
                    {num}
                  </span>
                  <span className="truncate">{label}</span>
                </CollapseInline>

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
                    <span className="block text-white/70">
                      {badgeCount > 0
                        ? `${badgeCount} menunggu verifikasi`
                        : shortLabel}
                    </span>
                  </span>
                )}
              </Link>
            );
          },
        )}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t-4 border-black transition-[padding]",
          DUR,
          EASE,
          collapsed ? "px-3 py-4" : "px-4 py-4",
        )}
      >
        <CollapseBlock collapsed={collapsed}>
          <div className="flex items-center justify-between border-2 border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
        </CollapseBlock>

        {/* Kartu identitas admin, gaya "ID badge" */}
        <div
          className={cn(
            "relative flex items-center border-2 border-black bg-white px-2.5 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
            DUR,
            EASE,
            collapsed ? "flex-col gap-2 px-1.5 py-2.5" : "gap-2.5",
          )}
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full w-1.5 bg-[#FFD400]"
          />
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 -rotate-3 items-center justify-center border-2 border-black bg-[#FFD400]",
              spaceMono.className,
              "text-[10px] font-bold",
            )}
            title={userEmail}
          >
            {initials}
          </div>
          <CollapseInline
            collapsed={collapsed}
            maxWidth="12rem"
            className="min-w-0 flex-1"
          >
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
          </CollapseInline>
        </div>

        <div
          className={cn(
            "mt-3 transition-all",
            DUR,
            EASE,
            collapsed && "flex justify-center",
          )}
        >
          <LogoutButton compact={collapsed} />
        </div>
      </div>
    </>
  );
}
