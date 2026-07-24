import Container from "@/components/Container";
import Button from "@/components/Button";
import PosterFrame from "@/components/PosterFrame";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function Hero() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-12">
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
                Selamat datang di Al Azhar Creative Steps (ACS) 2026! Sebagai
                wadah tahunan kreativitas murid SMA Islam Al Azhar 4, tahun ini
                kami hadir mengusung tema "ARCHIPELAPACE: Rhythm of a Thousand
                Islands"—sebuah perpaduan harmonis antara kekayaan Archipelago
                dan semangat Pace gaya hidup sehat. Mari salurkan potensi,
                bakat, dan semangat persatuan generasi muda dalam perayaan
                budaya Nusantara yang dinamis!
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/registration">Registration</Button>
              <Button href="/information" variant="secondary">
                Learn More
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <PosterFrame />
          </div>
        </div>
      </Container>
    </section>
  );
}
