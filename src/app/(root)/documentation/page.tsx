import Container from "@/components/Container";
import Button from "@/components/Button";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import { driveFolders } from "@/libs/config/documentation";

export default function DocumentationPage() {
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
              Documentation
            </h1>

            <p
              className={cn(
                spaceMono.className,
                "mx-auto mt-5 max-w-lg text-xs uppercase tracking-widest text-black sm:text-sm",
              )}
            >
              ACS 2026 : Photos &amp; Video Archive
            </p>
          </div>
        </Container>
      </section>

      <Container>
        {/* RELIVE THE MEMORIES */}
        <section className="py-16 sm:py-24">
          <div className="text-center">
            <span
              className={cn(
                SpecialGhotic.className,
                "inline-block -rotate-2 border-4 border-black bg-[#5AC8FA] px-4 py-1.5 text-xs uppercase tracking-tight shadow-[4px_4px_0px_0px_#000] sm:text-sm",
              )}
            >
              Last Year&apos;s Archive
            </span>

            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-6 text-3xl uppercase leading-[0.95] tracking-tight text-black sm:text-5xl",
              )}
            >
              Relive The Memories
            </h2>
          </div>

          <div className="mt-10">
            <div className="flex flex-col gap-4 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-black text-2xl",
                  )}
                >
                  📁
                </span>
                <div>
                  <h3
                    className={cn(
                      SpecialGhotic.className,
                      "text-lg uppercase leading-snug tracking-tight text-black sm:text-xl",
                    )}
                  >
                    AL AZHAR CREATIVE STEPS DOCUMENTATION
                  </h3>
                  <p className="mt-2 text-sm text-black/60">
                    Photos, videos, and event recap from last year's ACS
                  </p>
                </div>
              </div>

              <Button
                href="https://drive.google.com/drive/folders/1ErqbmsiOd9AfOi4LQsACM8l6Qv3UiAsA"
                external
                size="sm"
                className="shrink-0 self-start sm:self-center"
              >
                Open Drive →
              </Button>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="mb-16 sm:mb-24">
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
              Mau jadi bagian dari
              <br className="hidden sm:block" /> cerita tahun ini?
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Daftarkan dirimu di ACS 2026 dan buat momen barumu sendiri.
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
