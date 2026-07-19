import { SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import Image from "next/image";

export default function PosterFrame() {
  return (
    <div className="relative mx-auto w-fit">
      <div
        aria-hidden
        className="absolute -bottom-6 -right-6 h-full w-full rotate-3 border-4 border-black bg-[#FFD400]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.25) 1.6px, transparent 1.6px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative -rotate-2 border-4 border-black bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <div className="relative aspect-[210/297] w-40 overflow-hidden sm:w-48 md:w-52">
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <span
              className={cn(
                SpecialGhotic.className,
                "text-xs uppercase tracking-widest text-black/40",
              )}
            >
              Poster
            </span>
          </div>
          <Image
            src="https://cdn.quatrolympic.com/DSC05068.JPG"
            alt="Poster ACS 2026: Archipelapace"
            fill
            className="object-cover hover:scale-105 duration-200"
            priority
          />
        </div>

        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-3 border-2 border-black/60 bg-lime-300/80"
        />
      </div>

      <span className="absolute -bottom-3 -right-3 rotate-3 border-4 border-black bg-[#FF5A1F] px-2.5 py-1 text-[10px] uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:text-xs">
        23.08.2026
      </span>

      <span
        aria-hidden
        className="absolute -left-4 -top-4 h-4 w-4 rotate-45 border-2 border-black bg-[#1F4B33]"
      />
    </div>
  );
}
