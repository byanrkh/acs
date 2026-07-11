import Container from "@/components/Container";
import Button from "@/components/Button";
import PosterFrame from "@/components/PosterFrame";

export default function Hero() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-12">
          <div>
            <span className="inline-block -rotate-2 border-4 border-ink bg-lime-300 px-4 py-1.5 text-sm font-bold shadow-brutal-sm">
              ACS 2026 · by Quatrolympic
            </span>

            <h2 className="mt-6 font-display text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl">
              ARCHIPELAGO
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

            {/* quick facts, biar hero gak cuma teks+tombol */}
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t-4 border-ink pt-6">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-ink/50">
                  Tanggal
                </dt>
                <dd className="font-display text-sm uppercase">
                  23 Agustus 2026
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-ink/50">
                  Lokasi
                </dt>
                <dd className="font-display text-sm uppercase">Bekasi</dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-ink/50">
                  Kuota
                </dt>
                <dd className="font-display text-sm uppercase">300 Slot</dd>
              </div>
            </dl>
          </div>

          <div className="flex justify-center">
            <PosterFrame />
          </div>
        </div>
      </Container>
    </section>
  );
}
