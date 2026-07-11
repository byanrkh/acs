import type { Metadata } from "next";
import { spaceGrotesk } from "@/libs/Font";
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
    <html lang="id" className={`${spaceGrotesk.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
