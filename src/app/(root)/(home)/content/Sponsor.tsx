import React from "react";
import Marquee from "react-fast-marquee";
import { spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function Sponsor() {
  return (
    <section className="border-y-4 border-black bg-black">
      <Marquee
        autoFill
        gradient={true}
        gradientColor="black"
        gradientWidth={40}
        speed={80}
        pauseOnHover
        className="overflow-y-hidden py-4 text-[#FFD400]"
      >
        <ul className="flex items-center">
          <li
            className={cn(
              spaceMono.className,
              "flex items-center gap-5 px-10 text-sm uppercase tracking-widest",
            )}
          >
            Sponsor &amp; Media Partner Goes Here
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[#FFD400]/50"
            />
          </li>
        </ul>
      </Marquee>
    </section>
  );
}
