import Container from "@/components/Container";
import Button from "@/components/Button";
import InfoAccordion from "@/components/information/InfoAccordion";
import InfoTimeline from "@/components/information/InfoTimeline";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

const quickFacts = [
  { label: "Tanggal Acara", value: "23 Agustus 2026", icon: "📅" },
  {
    label: "Lokasi",
    value: "Kompleks SMAI Al Azhar 4, Kemang Pratama",
    icon: "📍",
  },
];

export default function InformationPage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative border-b-4 border-black bg-[#FF5A1F] py-16 sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.6) 1.6px, transparent 1.6px)",
            backgroundSize: "22px 22px",
          }}
        />
        <span
          aria-hidden
          className="absolute -left-6 top-10 h-16 w-16 rotate-12 border-4 border-black bg-[#FFD400] sm:h-24 sm:w-24"
        />
        <span
          aria-hidden
          className="absolute -right-8 bottom-6 h-20 w-20 -rotate-12 border-4 border-black bg-[#7ED957] sm:h-28 sm:w-28"
        />

        <Container>
          <div className="relative text-center">
            <span
              className={cn(
                SpecialGhotic.className,
                "inline-block -rotate-2 border-4 border-black text-black bg-[#7ED957] px-4 py-1.5 text-xs uppercase tracking-tight shadow-[4px_4px_0px_0px_#000] sm:text-sm",
              )}
            >
              ACS 2026
            </span>

            <h1
              className={cn(
                SpecialGhotic.className,
                "mt-6 text-4xl uppercase leading-[0.9] tracking-tight text-black sm:text-7xl md:text-8xl",
              )}
            >
              Information
            </h1>

            <p
              className={cn(
                spaceMono.className,
                "mx-auto mt-5 max-w-lg text-xs uppercase tracking-widest text-black sm:text-sm",
              )}
            >
              ACS 2026 : Information &amp; Guidelines
            </p>
          </div>
        </Container>
      </section>

      <Container>
        {/* INTRO */}
        <section className="relative -mt-8 sm:-mt-10">
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-10">
            <span className="inline-block -rotate-1 border-2 border-black bg-[#FFD400] px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
              Archipelapace : Rhythm of a Thousand Islands
            </span>

            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-4 text-2xl uppercase tracking-tight sm:text-3xl",
              )}
            >
              ACS 2026
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-black/80 sm:text-base">
              <p>
                Al Azhar Creative Steps (ACS) 2026 merupakan sebuah manifestasi
                kreativitas yang diselenggarakan oleh SMA Islam Al Azhar 4
                sebagai wadah untuk mengembangkan potensi, minat, dan bakat
                murid-murid melalui rangkaian kegiatan yang kolaboratif. ACS
                telah menjadi agenda tahunan yang dinantikan, yang dilaksanakan
                dengan semangat antusiasme tinggi oleh seluruh elemen sekolah
                dan masyarakat.
              </p>
              <p>
                Tahun ini, tema{" "}
                <span className="font-bold">
                  &ldquo;Archipelapace: Rhythm of a Thousand Islands&rdquo;
                </span>{" "}
                dipilih untuk merefleksikan keberagaman dan keharmonisan
                Nusantara yang kaya akan nilai budaya. Tema ini
                merepresentasikan perpaduan antara Archipelago (kepulauan) dan
                Pace (kecepatan lari), yang melambangkan semangat persatuan
                dalam gerak yang dinamis. Melalui rangkaian kegiatan ini, kami
                berkomitmen untuk menumbuhkan rasa percaya diri, kreativitas,
                serta kesadaran generasi muda untuk mengenal, menghargai, dan
                mencintai kekayaan budaya Indonesia dalam bingkai gaya hidup
                sehat.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/contact">Contact Us ↗</Button>
              <Button href="/registration" variant="secondary">
                Register Now
              </Button>
            </div>
          </div>
        </section>

        {/* QUICK FACTS */}
        <section className="mt-10 sm:mt-14">
          <div className="grid grid-cols-2 gap-4 ">
            {quickFacts.map((fact, i) => (
              <div
                key={fact.label}
                className={cn(
                  "border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 sm:p-5",
                  i % 2 === 0 ? "sm:rotate-0" : "sm:rotate-0",
                )}
              >
                <span aria-hidden className="text-2xl sm:text-3xl">
                  {fact.icon}
                </span>
                <p
                  className={cn(
                    spaceMono.className,
                    "mt-3 text-[10px] uppercase tracking-widest text-black/50",
                  )}
                >
                  {fact.label}
                </p>
                <p className="mt-1 text-sm font-bold leading-snug sm:text-base">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <div className="mb-8 sm:mb-10">
            <span
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-[#FF5A1F]",
              )}
            >
              Maps
            </span>
            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-2 text-3xl uppercase tracking-tight sm:text-4xl",
              )}
            >
              VENUE & TRACK
            </h2>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="mt-16 sm:mt-24">
          <div className="mb-8 sm:mb-10">
            <span
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-[#FF5A1F]",
              )}
            >
              Timeline
            </span>
            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-2 text-3xl uppercase tracking-tight sm:text-4xl",
              )}
            >
              Jadwal Penting
            </h2>
          </div>

          <InfoTimeline />
        </section>

        <section className="mt-16 sm:mt-24">
          <div className="mb-8 sm:mb-10">
            <span
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-[#FF5A1F]",
              )}
            >
              Read before register!
            </span>
            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-2 text-3xl uppercase tracking-tight sm:text-4xl",
              )}
            >
              Terms Of Service - ACS FUN RUN
            </h2>
          </div>
          <p className="text-sm opacity-50 mb-5">Last Updated: 20/07/2026</p>
          <InfoAccordion />
        </section>

        {/* CTA BANNER */}
        <section className="my-16 sm:my-24">
          <div className="relative overflow-hidden border-4 border-black bg-black px-6 py-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:px-10 sm:py-16">
            <span
              aria-hidden
              className="absolute -left-10 -top-10 h-32 w-32 rotate-12 rounded-full border-4 border-white/20"
            />
            <span
              aria-hidden
              className="absolute -bottom-12 -right-8 h-40 w-40 -rotate-12 border-4 border-white/20"
            />

            <h2
              className={cn(
                SpecialGhotic.className,
                "relative text-2xl uppercase leading-tight tracking-tight text-white sm:text-4xl",
              )}
            >
              Siap gabung jadi bagian
              <br className="hidden sm:block" /> dari ACS 2026?
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Amankan slot dan nomor BIB kamu sekarang, sebelum penuh.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Button href="/registration">Register Now</Button>
              <Button href="/contact" variant="secondary">
                Contact Us ↗
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
