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
  { label: "WhatsApp", value: "-" },
  { label: "Instagram", value: "@acs.projectid" },
];

export default function Footer() {
  return (
    <footer className="mt-auto p-3">
      <div className="bg-white p-10 border-4 rounded-lg shadow-[4px_4px]">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <p className="text-2xl uppercase tracking-tight font-bold">
              Al Azhar Creative Steps
            </p>
            <p className="mt-3 max-w-xs font-medium leading-relaxed ">
              Pre-event Quatrolympic 2026 — rhythm of a thousand islands. Lomba
              lari yang merayakan keberagaman dan semangat kepemudaan nusantara.
            </p>
          </div>

          <div>
            <p
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest ",
              )}
            >
              Navigasi
            </p>
            <ul className="mt-4 space-y-2">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-medium transition-colors hover:text-[#FF5A1F]"
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
                "text-xs uppercase tracking-widest ",
              )}
            >
              Kontak
            </p>
            <ul className="mt-4 space-y-2">
              {contacts.map((c) => (
                <li key={c.label} className="font-medium ">
                  <span className="">{c.label}: </span>
                  {c.value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t-2 border-[#FDF6E9]/20 pt-6 text-xs  sm:flex-row">
          <p className="flex gap-1 items-center">
            © 2026 ACS: Archipelapace. Bagian dari{" "}
            <Link
              className="text-blue-800 hover:text-blue-700 flex gap-0.5"
              target="_blank"
              href={"https://quatrolympic.com"}
            >
              Quatrolympic
              <FaExternalLinkAlt size={10} />
            </Link>
            .
          </p>
          <p>Dibuat dengan semangat seribu pulau.</p>
        </div>
      </div>
    </footer>
  );
}
