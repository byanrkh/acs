import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHero from "@/components/PageHero";
import RegistrationForm from "@/components/RegistrationForm";
import { spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export const metadata: Metadata = {
  title: "Registration — ACS 2026: Archipelapace",
};

export default function RegistrationPage() {
  return (
    <div className="overflow-hidden pb-16 md:pb-24">
      <PageHero
        eyebrow="Register Now!"
        title="Amankan Bib-mu"
        subtitle="300 slot saja"
      />

      <Container>
        <div className="relative -mt-8 mx-auto max-w-3xl sm:-mt-10">
          <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
            <p className="leading-relaxed text-black/80">
              Fill in your personal data completely and correctly. Slots are
              limited to 300 only, so make sure to secure your spot immediately.
            </p>
            <p
              className={cn(
                spaceMono.className,
                "mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#FF5A1F]",
              )}
            >
              🏁 3 checkpoint sampai garis finish pendaftaran
            </p>
          </div>

          <div className="mt-10">
            <RegistrationForm />
          </div>
        </div>
      </Container>
    </div>
  );
}
