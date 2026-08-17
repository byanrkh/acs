import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Stats = {
  totalPeserta: number;
  totalConfirmed: number;
  totalPending: number;
  totalExpired: number;
  totalCancelled: number;
  totalRacePackTaken: number;
  totalPelajar: number;
  totalUmum: number;
  totalPendapatan: number;
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(amount);
}

/* ---------------------------------- Icons --------------------------------- */

function IconCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M3 10l4.5 4.5L17 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="10" r="7.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10 6v4.5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBox({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M2.5 6.5L10 2.5l7.5 4L10 10.5l-7.5-4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 6.5V14L10 18l7.5-4V6.5M10 10.5V18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMoney({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect
        x="2"
        y="5"
        width="16"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconTrendUp({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M3 14l5-5 3.5 3.5L17 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 5h5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Segitiga peringatan — dipakai buat kartu "Kedaluwarsa" (auto-expired
// karena telat bayar 3 jam).
function IconAlertTriangle({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M10 3.2l7.8 13.5H2.2L10 3.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 8.3v3.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14.3" r="0.9" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------- Small parts ------------------------------- */

// Sudut robekan "tiket" — dipakai di kartu unggulan biar konsisten sama
// aksen tiket yang udah ada di Sidebar (item aktif).
function TicketNotch({
  tone = "border-black bg-[#FDF6E9]",
}: {
  tone?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-2",
        tone,
      )}
    />
  );
}

function StatBadge({
  value,
  positive = true,
}: {
  value: string;
  positive?: boolean;
}) {
  return (
    <span
      className={cn(
        spaceMono.className,
        "inline-flex items-center gap-1 border-2 border-black px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest",
        positive ? "bg-[#7ED957] text-black" : "bg-white text-black",
      )}
    >
      <IconTrendUp className="h-2.5 w-2.5" />
      {value}
    </span>
  );
}

/* --------------------------------- Widget ---------------------------------- */

export default function StatsCards({ stats }: { stats: Stats }) {
  const confirmRate =
    stats.totalPeserta > 0
      ? Math.round((stats.totalConfirmed / stats.totalPeserta) * 100)
      : 0;
  const racePackRate =
    stats.totalConfirmed > 0
      ? Math.round((stats.totalRacePackTaken / stats.totalConfirmed) * 100)
      : 0;

  const secondaryCards = [
    {
      label: "Menunggu Bayar",
      value: `${stats.totalPending}`,
      sub: "Batas waktu 3 jam",
      bg: "bg-[#FFD400]",
      text: "text-black",
      icon: IconClock,
    },
    {
      label: "Kedaluwarsa",
      value: `${stats.totalExpired}`,
      sub: "Otomatis, telat bayar",
      bg: "bg-black",
      text: "text-white",
      icon: IconAlertTriangle,
    },
    {
      label: "Race Pack Diambil",
      value: `${stats.totalRacePackTaken}/${stats.totalConfirmed}`,
      sub: `${racePackRate}% sudah ambil`,
      bg: "bg-white",
      text: "text-black",
      icon: IconBox,
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Kartu unggulan: Terkonfirmasi */}
      <div className="group relative overflow-hidden border-4 border-black p-4 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        <TicketNotch tone="border-black bg-[#fff]" />
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                spaceMono.className,
                "text-[9px] uppercase tracking-widest text-black/50 sm:text-[10px]",
              )}
            >
              01 · Terkonfirmasi
            </p>
            <p
              className={cn(
                SpecialGhotic.className,
                "mt-1 text-3xl leading-none sm:text-5xl",
              )}
            >
              {stats.totalConfirmed}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white sm:h-11 sm:w-11">
            <IconCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatBadge
            value={`${confirmRate}% dari ${stats.totalPeserta} pendaftar`}
          />
        </div>
      </div>

      {/* Kartu sekunder: Menunggu Bayar, Kedaluwarsa, Race Pack */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {secondaryCards.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "group relative overflow-hidden border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-5",
              c.bg,
              c.text,
            )}
          >
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  spaceMono.className,
                  "text-[9px] uppercase tracking-widest opacity-60 sm:text-[10px]",
                )}
              >
                {String(i + 2).padStart(2, "0")} · {c.label}
              </p>
              <c.icon />
            </div>
            <p
              className={cn(
                SpecialGhotic.className,
                "mt-1 text-2xl leading-tight sm:text-3xl",
              )}
            >
              {c.value}
            </p>
            {c.sub && (
              <p
                className={cn(
                  spaceMono.className,
                  "mt-1 text-[9px] uppercase tracking-widest opacity-70",
                )}
              >
                {c.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Total Pendapatan — full width, warna paling nendang, angka gede */}
      <div className="group relative overflow-hidden border-4 border-black bg-[#FF5A1F] p-4 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        {/* Pola garis diagonal tipis buat tekstur, ga ganggu keterbacaan */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
        >
          <defs>
            <pattern
              id="revenue-stripes"
              width="16"
              height="16"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <rect width="8" height="16" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#revenue-stripes)" />
        </svg>

        <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p
              className={cn(
                spaceMono.className,
                "flex items-center gap-2 text-[9px] uppercase tracking-widest opacity-70 sm:text-[10px]",
              )}
            >
              <IconMoney className="h-3.5 w-3.5" />
              05 · Total Pendapatan
            </p>
            <p
              className={cn(
                SpecialGhotic.className,
                "mt-1 text-3xl leading-none tracking-tight sm:text-5xl",
              )}
            >
              {formatRupiah(stats.totalPendapatan)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 border-2 border-white/40 bg-black/15 px-3 py-1.5 self-start sm:self-auto">
            <span
              className={cn(
                spaceMono.className,
                "text-[9px] uppercase tracking-widest opacity-80",
              )}
            >
              Est. {formatCompactRupiah(stats.totalPendapatan)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
