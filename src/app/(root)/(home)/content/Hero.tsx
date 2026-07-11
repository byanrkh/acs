import Container from "@/components/Container";
import { cn } from "@/libs/cn";
import { SpecialGhotic } from "@/libs/Font";
import Link from "next/link";
import React from "react";

export default function Hero() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-3 md:gap-12">
          <div className="md:col-span-2">
            <span className="text-sm inline-block -rotate-2 border-[3px] bg-lime-300 px-4 py-1.5 font-bold shadow-[4px_4px]">
              ACS 2026 · by Quatrolympic
            </span>
            <h2 className={cn(SpecialGhotic.className, "mt-6 text-5xl")}>
              ARCHIPELAGO
            </h2>
            <div className="mt-6 font-medium leading-relaxed text-black md:text-[17px]">
              <p>
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Veritatis, corrupti aliquid cum excepturi tempore rem commodi
                libero a iure sed! Placeat enim porro iste sint accusamus
                recusandae obcaecati quam asperiores vel culpa ratione maxime
                dicta mollitia facilis, quidem accusantium odit.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={"/registration"}
                className="border-[3px] bg-[#FF5A1F] px-6 py-2 tracking-wide shadow-[5px_5px] hover:translate-x-1 uppercase hover:translate-y-1 duration-100 hover:shadow-none"
              >
                Registration
              </Link>
              <Link
                href={"/registration"}
                className="border-[3px] bg-white px-6 py-2 tracking-wide shadow-[5px_5px] hover:translate-x-1 uppercase hover:translate-y-1 duration-100 hover:shadow-none"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative h-96 w-full overflow-hidden border-[3px] border-black bg-gray-50">
              (poster)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
