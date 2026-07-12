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
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Veritatis, corrupti aliquid cum excepturi tempore rem commodi
                libero a iure sed! Placeat enim porro iste sint accusamus
                recusandae obcaecati quam asperiores vel culpa ratione maxime
                dicta mollitia facilis, quidem accusantium odit.
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
