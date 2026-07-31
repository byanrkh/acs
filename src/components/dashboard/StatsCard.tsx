import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Stats = {
  totalPeserta: number;
  totalConfirmed: number;
  totalPending: number;
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

function IconUsers() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="7" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 17c0-3 2.2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12.5 12.2c2.4.2 4 1.9 4.5 4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M3 10l4.5 4.5L17 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="10" cy="10" r="7.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 6v4.5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M2.5 6.5L10 2.5l7.5 4L10 10.5l-7.5-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2.5 6.5V14L10 18l7.5-4V6.5M10 10.5V18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconSplit() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M4 10h12M4 10l4-4M4 10l4 4M16 10l-4-4M16 10l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <rect x="2" y="5" width="16" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Total Peserta",
      value: `${stats.totalPeserta}`,
      bg: "bg-white",
      text: "text-black",
      icon: IconUsers,
    },
    {
      label: "Terkonfirmasi",
      value: `${stats.totalConfirmed}`,
      bg: "bg-[#7ED957]",
      text: "text-black",
      icon: IconCheck,
    },
    {
      label: "Menunggu Bayar",
      value: `${stats.totalPending}`,
      bg: "bg-[#FFD400]",
      text: "text-black",
      icon: IconClock,
    },
    {
      label: "Race Pack Diambil",
      value: `${stats.totalRacePackTaken}/${stats.totalConfirmed}`,
      bg: "bg-white",
      text: "text-black",
      icon: IconBox,
    },
    {
      label: "Pelajar / Umum",
      value: `${stats.totalPelajar} / ${stats.totalUmum}`,
      bg: "bg-white",
      text: "text-black",
      icon: IconSplit,
    },
    {
      label: "Total Pendapatan",
      value: formatRupiah(stats.totalPendapatan),
      bg: "bg-[#FF5A1F]",
      text: "text-white",
      icon: IconMoney,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "group relative overflow-hidden border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6",
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
              {c.label}
            </p>
            <c.icon />
          </div>
          <p
            className={cn(
              SpecialGhotic.className,
              "mt-1 text-lg leading-tight sm:text-2xl",
            )}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
