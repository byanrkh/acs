import Container from "@/components/Container";
import Button from "@/components/Button";
import PageHero from "@/components/PageHero";
import CtaBanner from "@/components/CtaBanner";
import InfoAccordion from "@/components/information/InfoAccordion";
import InfoTimeline from "@/components/information/InfoTimeline";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import Image from "next/image";

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
      <PageHero
        title="Information"
        subtitle="ACS 2026 : Information & Guidelines"
      />

      <Container>
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
            <div className="mt-6 flex flex-wrap gap-3">
              {quickFacts.map((f) => (
                <span
                  key={f.label}
                  className={cn(
                    spaceMono.className,
                    "inline-flex items-center gap-2 border-2 border-black bg-[#FDF6E9] px-3 py-1.5 text-[11px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                  )}
                >
                  <span aria-hidden>{f.icon}</span>
                  {f.value}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/contact">Contact Us ↗</Button>
              <Button href="/registration" variant="secondary">
                Register Now
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-10 sm:mt-14">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
              <div className="relative border-b-4 border-black bg-[#7ED957] px-5 py-4 text-center">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(0,0,0,0.6) 1.6px, transparent 1.6px)",
                    backgroundSize: "22px 22px",
                  }}
                />
                <p
                  className={cn(
                    SpecialGhotic.className,
                    "relative text-lg uppercase tracking-tight text-black sm:text-xl",
                  )}
                >
                  Price List
                </p>
              </div>

              <div className="flex-1 space-y-3 p-5 sm:p-6">
                <div className="flex items-center justify-between border-2 border-black/10 bg-[#FDF6E9] px-4 py-3">
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-xs uppercase tracking-widest text-black/60",
                    )}
                  >
                    Pelajar
                  </p>
                  <p
                    className={cn(
                      SpecialGhotic.className,
                      "text-xl tracking-tight sm:text-2xl",
                    )}
                  >
                    Rp200.000
                  </p>
                </div>
                <div className="flex items-center justify-between border-2 border-black/10 bg-[#FDF6E9] px-4 py-3">
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-xs uppercase tracking-widest text-black/60",
                    )}
                  >
                    Umum
                  </p>
                  <p
                    className={cn(
                      SpecialGhotic.className,
                      "text-xl tracking-tight sm:text-2xl",
                    )}
                  >
                    Rp225.000
                  </p>
                </div>
              </div>

              <div className="border-t-4 border-black p-5 sm:p-6">
                <Button href="/registration" className="w-full justify-center">
                  Daftar
                </Button>
              </div>
            </div>

            {/* Poster / dokumentasi pendukung */}
            <div className="relative overflow-hidden border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1">
              <div className="relative aspect-[4/3] w-full sm:aspect-auto sm:h-full">
                <Image
                  src="https://cdn.quatrolympic.com/1784867389144-a03ed0d9-bd5b-4f9d-9ec4-0eac46e42761_1.jpg"
                  alt="Dokumentasi kegiatan ACS"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
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
              VENUE &amp; TRACK
            </h2>
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
          <p className="mb-5 text-sm text-black/50">Last Updated: 20/07/2026</p>
          <InfoAccordion />
        </section>

        <CtaBanner
          heading="Siap gabung jadi bagian"
          headingBreak="dari ACS 2026?"
          description="Amankan slot dan nomor BIB kamu sekarang, sebelum penuh."
          primary={{ href: "/registration", label: "Register Now" }}
          secondary={{ href: "/contact", label: "Contact Us ↗" }}
        />
      </Container>
    </div>
  );
}
