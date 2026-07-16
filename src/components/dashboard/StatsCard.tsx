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

export default function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Peserta", value: `${stats.totalPeserta}`, bg: "bg-white" },
    {
      label: "Terkonfirmasi",
      value: `${stats.totalConfirmed}`,
      bg: "bg-[#7ED957]",
    },
    {
      label: "Menunggu Bayar",
      value: `${stats.totalPending}`,
      bg: "bg-[#FFD400]",
    },
    {
      label: "Race Pack Diambil",
      value: `${stats.totalRacePackTaken}/${stats.totalConfirmed}`,
      bg: "bg-white",
    },
    {
      label: "Pelajar / Umum",
      value: `${stats.totalPelajar} / ${stats.totalUmum}`,
      bg: "bg-white",
    },
    {
      label: "Total Pendapatan",
      value: formatRupiah(stats.totalPendapatan),
      bg: "bg-[#FF5A1F]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-4",
            c.bg,
          )}
        >
          <p
            className={cn(
              spaceMono.className,
              "text-[9px] uppercase tracking-widest text-black/60 sm:text-[10px]",
            )}
          >
            {c.label}
          </p>
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
