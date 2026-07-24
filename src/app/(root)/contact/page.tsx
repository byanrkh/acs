import Container from "@/components/Container";
import Button from "@/components/Button";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import { CONTACT_INFO, whatsappHref } from "@/libs/config/contact";
import {
  FaEnvelope,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
} from "react-icons/fa";

const hasWhatsapp =
  CONTACT_INFO.whatsapp !== "-" && CONTACT_INFO.whatsapp.length > 0;

const contactCards = [
  {
    label: "Email",
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
    icon: FaEnvelope,
    color: "bg-[#FFD400]",
  },
  ...(hasWhatsapp
    ? [
        {
          label: "WhatsApp",
          value: CONTACT_INFO.whatsapp,
          href: whatsappHref(CONTACT_INFO.whatsapp),
          icon: FaWhatsapp,
          color: "bg-[#7ED957]",
        },
      ]
    : []),
  {
    label: "Instagram",
    value: CONTACT_INFO.instagram,
    href: CONTACT_INFO.instagramUrl,
    icon: FaInstagram,
    color: "bg-[#5AC8FA]",
  },
];

const faqs = [
  {
    q: "Mau tanya status pembayaran, harus kemana?",
    a: "Sertakan nama lengkap & email yang dipakai saat daftar supaya panitia bisa cek datanya dengan cepat.",
  },
  {
    q: "Bisa reschedule / refund kalau berhalangan?",
    a: "Untuk kebijakan reschedule dan refund, silakan hubungi panitia langsung lewat email atau Instagram di atas.",
  },
];

export default function ContactPage() {
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
              Contact
            </h1>

            <p
              className={cn(
                spaceMono.className,
                "mx-auto mt-5 max-w-lg text-xs uppercase tracking-widest text-black sm:text-sm",
              )}
            >
              Ada pertanyaan? Hubungi kami
            </p>
          </div>
        </Container>
      </section>

      <Container>
        {/* CONTACT CARDS */}
        <section className="relative -mt-8 sm:-mt-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {contactCards.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    c.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="group flex flex-col items-center gap-3 border-4 border-black bg-white p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border-4 border-black text-2xl text-black",
                      c.color,
                    )}
                  >
                    <Icon />
                  </span>
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-[11px] uppercase tracking-widest text-black/50",
                    )}
                  >
                    {c.label}
                  </p>
                  <p className="break-all text-sm font-bold text-black group-hover:text-[#FF5A1F]">
                    {c.value}
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        {/* LOCATION */}
        <section className="mt-16 sm:mt-24">
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-10">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-black bg-[#FFD400] text-2xl text-black"
                >
                  <FaMapMarkerAlt />
                </span>
                <div>
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-[11px] uppercase tracking-widest text-black/50",
                    )}
                  >
                    Lokasi Acara
                  </p>
                  <h2
                    className={cn(
                      SpecialGhotic.className,
                      "mt-1 text-xl uppercase tracking-tight text-black sm:text-2xl",
                    )}
                  >
                    {CONTACT_INFO.address}
                  </h2>
                </div>
              </div>

              <Button
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`}
                external
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                Buka Maps ↗
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 sm:mt-24">
          <div className="mb-8 sm:mb-10">
            <span
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-[#FF5A1F]",
              )}
            >
              Sering ditanyakan
            </span>
            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-2 text-3xl uppercase tracking-tight sm:text-4xl",
              )}
            >
              FAQ
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6"
              >
                <p
                  className={cn(
                    SpecialGhotic.className,
                    "text-base uppercase tracking-tight text-black sm:text-lg",
                  )}
                >
                  {faq.q}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="my-16 sm:my-24">
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
              Masih ada yang mau
              <br className="hidden sm:block" /> ditanyain?
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm text-white/70 sm:text-base">
              Langsung aja DM Instagram atau email kami, panitia siap bantu.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Button href={`mailto:${CONTACT_INFO.email}`}>Email Kami</Button>
              <Button
                href={CONTACT_INFO.instagramUrl}
                external
                variant="secondary"
              >
                Instagram ↗
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
