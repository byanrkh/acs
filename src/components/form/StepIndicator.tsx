"use client";

import { cn } from "@/libs/cn";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

type StepIndicatorProps = {
  steps: string[];
  current: number;
};

function IconRunner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="15.2" cy="4.6" r="2" fill="currentColor" />
      <path
        d="M13.2 7.8l-2.6 2.1 1 3.6-3 4.3M13.2 7.8l3 1.6 2.4 3.9M10.6 9.9l-4 1-1.4 3.6M13.2 7.8l-1.4 4.6 2.8 2 .6 3.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFlagSmall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M4 2v12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 3c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0v5.6c-1.6 1-3.2 1-4.8 0s-3.2-1-4.8 0V3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    // Baris tunggal: badge pelari, lingkaran nomor, dan garis penghubung semua
    // hidup di flex tree yang SAMA. Jadi posisi pelari selalu ngikutin
    // lingkaran nomor yang aktif secara alami — nggak ada lagi dua sistem
    // koordinat (persentase vs flex) yang gampang meleset kayak sebelumnya.
    <ol className="flex items-start">
      {steps.map((label, i) => {
        const stepNumber = i + 1;
        const isLast = i === steps.length - 1;
        const state =
          stepNumber < current
            ? "done"
            : stepNumber === current
              ? "active"
              : "upcoming";

        return (
          <li
            key={label}
            className={cn("flex items-center", !isLast && "flex-1")}
          >
            <div className="flex flex-col items-center gap-1.5">
              {/* Slot pelari: tingginya tetap dijaga (h-8) walau kosong,
                  biar lingkaran nomor di bawahnya nggak ikut naik-turun
                  pas berpindah step. */}
              <div className="flex h-8 items-center justify-center">
                {state === "active" && (
                  <span className="flex h-8 w-8 animate-bounce items-center justify-center rounded-full border-4 border-black bg-[#FFD400] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <IconRunner className="h-4 w-4 text-black" />
                  </span>
                )}
              </div>

              <div
                className={cn(
                  SpecialGhotic.className,
                  "flex h-8 w-8 shrink-0 items-center justify-center border-4 border-black text-sm transition-colors duration-300",
                  state === "active" &&
                    "bg-[#FF5A1F] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  state === "done" && "bg-[#1F4B33] text-white",
                  state === "upcoming" && "bg-white text-black/40",
                )}
              >
                {state === "done" ? (
                  <IconFlagSmall className="h-3.5 w-3.5" />
                ) : (
                  stepNumber
                )}
              </div>

              <span
                className={cn(
                  spaceMono.className,
                  "hidden text-[10px] uppercase tracking-widest sm:block",
                  state === "upcoming" ? "text-black/40" : "text-black",
                )}
              >
                {label}
              </span>
            </div>

            {!isLast && (
              // 54px = tinggi slot pelari (32px) + gap (6px) + setengah tinggi
              // lingkaran nomor (16px) → persis segaris sama titik tengah
              // lingkaran, bukan cuma nyampe slot pelari yang kosong di atasnya.
              <div
                className={cn(
                  "mx-3 mt-[54px] h-1 flex-1 self-start transition-colors duration-300",
                  stepNumber < current
                    ? "bg-[#1F4B33]"
                    : "border-t-4 border-dashed border-black/15 bg-transparent",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
