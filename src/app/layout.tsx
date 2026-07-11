import type { Metadata } from "next";
import { spaceGrotesk, spaceMono, SpecialGhotic } from "@/libs/Font";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACS 2026: Archipelapace",
  description:
    "Pre-event Quatrolympic ACS 2026, Archipelapace — rhythm of a thousand islands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${SpecialGhotic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-body">{children}</body>
    </html>
  );
}
