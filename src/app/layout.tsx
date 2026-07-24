import type { Metadata } from "next";
import { spaceGrotesk } from "@/libs/Font";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://acs.quatrolympic.com"),
  title:
    "Al Azhar Creative Steps: “ARCHIPELAPACE: Rhythm Of A Thousand Islands” ✨🌺",
  description:
    "Al Azhar Creative Steps (ACS) 2026 oleh SMA Islam Al Azhar 4 kembali hadir dengan tema “ARCHIPELAPACE: Rhythm of a Thousand Islands”. Wadah kreativitas, bakat, dan budaya Nusantara dalam bingkai gaya hidup sehat!",
  keywords: [
    "quatrolympic",
    "ACS",
    "Al Azhar Creative Steps",
    "Funrun",
    "Fun run",
    "running",
    "running event",
    "event",
    "energy",
    "Al Azhar 4",
    "Al Azhar",
    "SMAI Al Azhar 4",
    "quatrolympic.com",
    "quatrolympic 19",
  ],
  openGraph: {
    siteName: "ACS 2026",
    title:
      "Al Azhar Creative Steps: “ARCHIPELAPACE: Rhythm Of A Thousand Islands” ✨🌺",
    description:
      "Al Azhar Creative Steps (ACS) 2026 oleh SMA Islam Al Azhar 4 kembali hadir dengan tema “ARCHIPELAPACE: Rhythm of a Thousand Islands”. Wadah kreativitas, bakat, dan budaya Nusantara dalam bingkai gaya hidup sehat!",
    locale: "en-ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Al Azhar Creative Steps: “ARCHIPELAPACE: Rhythm Of A Thousand Islands” ✨🌺",
    description:
      "Al Azhar Creative Steps (ACS) 2026 oleh SMA Islam Al Azhar 4 kembali hadir dengan tema “ARCHIPELAPACE: Rhythm of a Thousand Islands”. Wadah kreativitas, bakat, dan budaya Nusantara dalam bingkai gaya hidup sehat!",
    creator: "@quatrolympic",
  },
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
