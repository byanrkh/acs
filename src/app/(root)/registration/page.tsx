import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHero from "@/components/PageHero";
import RegistrationForm from "@/components/RegistrationForm";
import { spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";
import { isRegistrationClosed } from "@/libs/actions/capacity";

export const metadata: Metadata = {
  title: "Registration — ACS 2026: Archipelapace",
};

export const dynamic = "force-dynamic";

export default async function RegistrationPage() {
  const registrationClosed = await isRegistrationClosed();

  return (
    <div className="overflow-hidden pb-16 md:pb-24">
      <PageHero
        eyebrow={registrationClosed ? "Pendaftaran Ditutup" : "Register Now!"}
        title={registrationClosed ? "Kuota Sudah Penuh" : "Amankan Bib-mu"}
        subtitle={
          registrationClosed
            ? "Sampai jumpa di ACS berikutnya"
            : "300 slot saja"
        }
      />

      <Container>
        <div className="relative -mt-8 mx-auto max-w-3xl sm:-mt-10">
          {registrationClosed ? (
            <div className="border-4 border-black bg-white p-5 space-y-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <h1 className="text-2xl font-bold text-black">
                🚨 REGISTRATION CLOSED!
              </h1>
              <p className="leading-relaxed text-black/80">
                Thank you so much for your amazing interest in ACS! 🫶🏻
              </p>
              <p className="leading-relaxed text-black/80">
                Pendaftaran ACS resmi ditutup karena kuota peserta telah
                mencapai batas maksimal / periode registrasi telah berakhir.
              </p>
              <p className="leading-relaxed text-black/80">
                Buat kamu yang belum sempat mendapatkan kesempatan untuk
                mendaftar tahun ini, don’t worry! 🥹✨ You can always join us
                again and register for ACS next year! 🤍
              </p>

              <p
                className={cn(
                  spaceMono.className,
                  "mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#FF5A1F]",
                )}
              >
                🏁 See you Runners at ACS 2027! 👀💫
              </p>
            </div>
          ) : (
            <>
              <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
                <p className="leading-relaxed text-black/80">
                  Fill in your personal data completely and correctly. Slots are
                  limited to 300 only, so make sure to secure your spot
                  immediately.
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
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
