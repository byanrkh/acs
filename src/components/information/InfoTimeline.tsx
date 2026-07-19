import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

const timeline = [
  {
    date: "1 February 2026",
    title: "Pendaftaran Dibuka",
    desc: "Registrasi online resmi dibuka untuk kategori Pelajar dan Umum.",
    color: "bg-[#FFD400]",
  },
  {
    date: "21–22 August 2026",
    title: "Pengambilan Race Pack",
    desc: "Ambil jersey, nomor BIB, dan perlengkapan lain sesuai jadwal yang dikirim via email.",
    color: "bg-[#7ED957]",
  },
  {
    date: "23 August 2026",
    title: "Hari Pelaksanaan",
    desc: "Puncak acara ACS 2026 — registrasi ulang, pemanasan bersama, lalu mulai berlari!",
    color: "bg-[#FF5A1F]",
  },
  {
    date: "Setelah acara",
    title: "E-Sertifikat & Dokumentasi",
    desc: "E-sertifikat dan dokumentasi resmi dibagikan melalui email terdaftar.",
    color: "bg-[#1F4B33]",
  },
];

export default function InfoTimeline() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute bottom-0 left-[15px] top-0 w-1 bg-black sm:left-[19px]"
      />
      <div className="space-y-8">
        {timeline.map((item) => (
          <div key={item.title} className="relative flex gap-5 pl-0 sm:gap-6">
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center border-4 border-black sm:h-10 sm:w-10",
                item.color,
              )}
            />
            <div className="flex-1 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-5">
              <p
                className={cn(
                  spaceMono.className,
                  "text-[11px] uppercase tracking-widest text-black/50",
                )}
              >
                {item.date}
              </p>
              <p
                className={cn(
                  SpecialGhotic.className,
                  "mt-1 text-base uppercase tracking-tight sm:text-lg",
                )}
              >
                {item.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-black/70">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
