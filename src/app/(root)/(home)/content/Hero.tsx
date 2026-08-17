import Container from "@/components/Container";
import Button from "@/components/Button";
import PosterFrame from "@/components/PosterFrame";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

const quickFacts = [
  { icon: "📅", label: "23 Agustus 2026" },
  { icon: "📍", label: "SMAI Al Azhar 4, Kemang Pratama" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.6) 1.6px, transparent 1.6px)",
          backgroundSize: "22px 22px",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 top-16 hidden h-24 w-24 rotate-12 border-4 border-black bg-[#FFD400] sm:block"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 bottom-10 hidden h-28 w-28 -rotate-12 rounded-full border-4 border-black bg-[#7ED957] sm:block"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-[28%] top-8 hidden h-9 w-9 rotate-45 border-2 border-black bg-[#A78BFA] md:block"
      />

      <Container>
        <div className="relative grid grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-12">
          <div>
            <span className="inline-block -rotate-2 border-4 border-black bg-lime-300 px-4 py-1.5 text-xs sm:text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ACS 2026 · by Quatrolympic
            </span>

            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-6 text-3xl uppercase leading-[0.95] tracking-tight sm:text-6xl",
              )}
            >
              ARCHIPELAPACE
            </h2>

            <div className="mt-6 font-medium leading-relaxed text-black md:text-[17px]">
              <p>
                Al Azhar Creative Steps (ACS) 2026 merupakan sebuah manifestasi
                kreativitas yang diselenggarakan oleh SMA Islam Al Azhar 4
                sebagai wadah untuk mengembangkan potensi, minat, dan bakat
                murid-murid melalui rangkaian kegiatan yang kolaboratif. ACS
                telah menjadi agenda tahunan yang dinantikan, yang dilaksanakan
                dengan semangat antusiasme tinggi oleh seluruh elemen sekolah
                dan masyarakat.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {quickFacts.map((f) => (
                <span
                  key={f.label}
                  className={cn(
                    spaceMono.className,
                    "inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-[11px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  )}
                >
                  <span aria-hidden>{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/registration">Registration</Button>
              <Button href="/information" variant="secondary">
                Learn More
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-6 hidden rounded-full border-4 border-dashed border-black/15 [animation:spin_28s_linear_infinite] sm:block"
              />
              <PosterFrame />
            </div>
          </div>
        </div>
        <div className="mt-14 flex justify-center md:mt-20">
          <span
            className={cn(
              spaceMono.className,
              "flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-black/40",
            )}
          >
            Scroll
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              className="animate-bounce"
              aria-hidden
            >
              <path
                d="M4 7l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </Container>
    </section>
  );
}
