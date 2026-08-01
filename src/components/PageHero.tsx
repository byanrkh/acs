import Container from "@/components/Container";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

// Garis "bendera finish" kotak-kotak tipis — dipakai di tepi bawah hero
// biar ada kesan race/fun-run tanpa berlebihan.
function CheckerStripe({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-3 w-full border-t-4 border-black", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, #000 0 12px, #FDF6E9 12px 24px)",
      }}
    />
  );
}

function IconFlag({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M5 2.5v15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 3.5c2-1.4 4-1.4 6 0s4 1.4 6 0v7c-2 1.4-4 1.4-6 0s-4-1.4-6 0v-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PageHero({
  eyebrow = "ACS 2026",
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b-4 border-black bg-[#FF5A1F] pt-16 sm:pt-20">
      <div
        aria-hidden
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.6) 1.6px, transparent 1.6px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Garis lintasan putus-putus di tengah, ala jalur lari */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 hidden h-0 -translate-y-1/2 border-t-4 border-dashed border-black/15 sm:block"
      />

      <span
        aria-hidden
        className="absolute -left-6 top-10 h-16 w-16 rotate-12 border-4 border-black bg-[#FFD400] sm:h-24 sm:w-24"
      />
      <span
        aria-hidden
        className="absolute -right-8 bottom-10 h-20 w-20 -rotate-12 border-4 border-black bg-[#7ED957] sm:h-28 sm:w-28"
      />

      <Container>
        <div className="relative pb-16 text-center sm:pb-20">
          <span
            className={cn(
              SpecialGhotic.className,
              "inline-flex items-center gap-2 -rotate-2 border-4 border-black bg-[#7ED957] px-4 py-1.5 text-xs uppercase tracking-tight text-black shadow-[4px_4px_0px_0px_#000] sm:text-sm",
            )}
          >
            <IconFlag />
            {eyebrow}
          </span>

          <h1
            className={cn(
              SpecialGhotic.className,
              "mt-6 text-4xl uppercase leading-[0.9] tracking-tight text-black sm:text-7xl md:text-8xl",
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className={cn(
                spaceMono.className,
                "mx-auto mt-5 max-w-lg text-xs uppercase tracking-widest text-black sm:text-sm",
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </Container>

      <CheckerStripe />
    </section>
  );
}
