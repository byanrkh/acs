import Container from "@/components/Container";
import Button from "@/components/Button";
import PageHero from "@/components/PageHero";
import CtaBanner from "@/components/CtaBanner";
import { SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function DocumentationPage() {
  return (
    <div className="overflow-hidden">
      <PageHero
        title="Documentation"
        subtitle="ACS 2026 : Photos & Video Archive"
      />

      <Container>
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
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-black text-2xl"
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
                    Photos, videos, and event recap from last year&apos;s ACS
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

        <CtaBanner
          heading="Mau jadi bagian dari"
          headingBreak="cerita tahun ini?"
          description="Daftarkan dirimu di ACS 2026 dan buat momen barumu sendiri."
          primary={{ href: "/registration", label: "Register Now" }}
          secondary={{ href: "/contact", label: "Contact Us ↗" }}
        />
      </Container>
    </div>
  );
}
