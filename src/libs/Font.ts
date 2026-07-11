import { Space_Grotesk, Space_Mono, Special_Gothic_Expanded_One } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const SpecialGhotic = Special_Gothic_Expanded_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-Gothic",
});

export { spaceGrotesk, spaceMono, SpecialGhotic };