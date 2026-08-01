import Link from "next/link";
import Container from "./Container";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";
import { FaExternalLinkAlt } from "react-icons/fa";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Information", href: "/information" },
  { label: "Registration", href: "/registration" },
  { label: "Contact", href: "/contact" },
];

const contacts = [
  { label: "Email", value: "acs.projectalkp4@gmail.com" },
  { label: "WhatsApp", value: "+62 856-9770-3733 (Gading)" },
  { label: "Instagram", value: "@acs.projectid" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-black bg-[#FDF6E9]">
      {/* Garis bendera finish tipis di batas atas footer */}
      <div
        aria-hidden
        className="h-3 w-full border-b-4 border-black"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #000 0 12px, #FDF6E9 12px 24px)",
        }}
      />

      <Container>
        <div className="py-10 sm:py-14">
          <div className="grid grid-cols-1 gap-10 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-10 md:grid-cols-3">
            <div>
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-xl uppercase tracking-tight sm:text-2xl",
                )}
              >
                Al Azhar Creative Steps
              </p>
              <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-black/70">
                Pre-event Quatrolympic 2026 — rhythm of a thousand islands.
                Lomba lari yang merayakan keberagaman dan semangat kepemudaan
                nusantara.
              </p>
            </div>

            <div>
              <p
                className={cn(
                  spaceMono.className,
                  "text-[11px] uppercase tracking-widest text-black/40",
                )}
              >
                Navigasi
              </p>
              <ul className="mt-4 space-y-2">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="font-medium text-black transition-colors hover:text-[#FF5A1F]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                className={cn(
                  spaceMono.className,
                  "text-[11px] uppercase tracking-widest text-black/40",
                )}
              >
                Kontak
              </p>
              <ul className="mt-4 space-y-2">
                {contacts.map((c) => (
                  <li
                    key={c.label}
                    className="text-sm font-medium text-black/80"
                  >
                    <span className="text-black/40">{c.label}: </span>
                    {c.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className={cn(
              spaceMono.className,
              "mt-6 flex flex-col items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-black/50 sm:flex-row",
            )}
          >
            <p className="flex items-center gap-1">
              © 2026 ACS: Archipelapace. Bagian dari{" "}
              <Link
                className="inline-flex items-center gap-1 font-bold text-black hover:text-[#FF5A1F]"
                target="_blank"
                href="https://quatrolympic.com"
              >
                Quatrolympic
                <FaExternalLinkAlt size={9} />
              </Link>
              .
            </p>
            <p>Dibuat dengan semangat seribu pulau.</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
