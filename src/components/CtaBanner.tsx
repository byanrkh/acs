import Button from "@/components/Button";
import { SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

// Aksen kotak-kotak di pojok, ala kain bendera finish balapan.
function CheckerCorner({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("absolute h-10 w-10 opacity-90", className)}
      style={{
        backgroundImage:
          "repeating-conic-gradient(#fff 0 25%, transparent 0 50%)",
        backgroundSize: "10px 10px",
      }}
    />
  );
}

export default function CtaBanner({
  heading,
  headingBreak,
  description,
  primary,
  secondary,
}: {
  heading: string;
  headingBreak?: string;
  description: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string; external?: boolean };
}) {
  return (
    <section className="my-16 sm:my-24">
      <div className="relative overflow-hidden border-4 border-black bg-black px-6 py-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:px-10 sm:py-16">
        <CheckerCorner className="left-0 top-0" />
        <CheckerCorner className="right-0 top-0 rotate-180" />

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
          {heading}
          {headingBreak && (
            <>
              <br className="hidden sm:block" /> {headingBreak}
            </>
          )}
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-sm text-white/70 sm:text-base">
          {description}
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-4">
          <Button href={primary.href}>{primary.label}</Button>
          {secondary && (
            <Button
              href={secondary.href}
              variant="secondary"
              external={secondary.external}
            >
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
