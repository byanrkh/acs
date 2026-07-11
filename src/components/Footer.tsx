import Link from "next/link";
import Container from "./Container";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Information", href: "/information" },
  { label: "Registration", href: "/registration" },
  { label: "Contact", href: "/contact" },
];

const contacts = [
  { label: "Email", value: "hello@archipelapace.id" },
  { label: "WhatsApp", value: "+62 812-0000-0000" },
  { label: "Instagram", value: "@acs.archipelapace" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-black bg-black text-[#FDF6E9]">
      <Container>
        <div className="grid grid-cols-1 gap-10 py-14 md:grid-cols-3">
          <div>
            <p
              className={cn(
                SpecialGhotic.className,
                "text-2xl uppercase tracking-tight",
              )}
            >
              ACS · Archipelapace
            </p>
            <p className="mt-3 max-w-xs font-medium leading-relaxed text-[#FDF6E9]/70">
              Pre-event Quatrolympic 2026 — rhythm of a thousand islands. Lomba
              lari yang merayakan keberagaman dan semangat kepemudaan nusantara.
            </p>
          </div>

          <div>
            <p
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-[#FDF6E9]/50",
              )}
            >
              Navigasi
            </p>
            <ul className="mt-4 space-y-2">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-medium text-[#FDF6E9] transition-colors hover:text-[#FF5A1F]"
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
                "text-xs uppercase tracking-widest text-[#FDF6E9]/50",
              )}
            >
              Kontak
            </p>
            <ul className="mt-4 space-y-2">
              {contacts.map((c) => (
                <li key={c.label} className="font-medium text-[#FDF6E9]">
                  <span className="text-[#FDF6E9]/50">{c.label}: </span>
                  {c.value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t-2 border-[#FDF6E9]/20 py-6 text-xs text-[#FDF6E9]/50 sm:flex-row">
          <p>© 2026 ACS: Archipelapace. Bagian dari Quatrolympic.</p>
          <p>Dibuat dengan semangat seribu pulau.</p>
        </div>
      </Container>
    </footer>
  );
}
