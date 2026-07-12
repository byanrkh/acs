import type { Metadata } from "next";
import Container from "@/components/Container";
import RegistrationForm from "@/components/RegistrationForm";
import { SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

export const metadata: Metadata = {
  title: "Registration — ACS 2026: Archipelapace",
};

export default function RegistrationPage() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl">
          <span className="inline-block -rotate-2 border-4 border-black bg-[#FFD400] px-4 py-1.5 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Registration
          </span>
          <h1
            className={cn(
              SpecialGhotic.className,
              "mt-6 text-4xl uppercase leading-[0.95] tracking-tight text-black sm:text-5xl",
            )}
          >
            REGISTER NOW!
          </h1>
          <p className="mt-4 leading-relaxed text-black/80">
            Fill in your personal data completely and correctly. Slots are
            limited to 300 only, so make sure to secure your spot immediately.
          </p>

          <div className="mt-10">
            <RegistrationForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
