"use client";

import { cn } from "@/libs/cn";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

type StepIndicatorProps = {
  steps: string[];
  current: number; // 1-based
};

export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const stepNumber = i + 1;
        const state =
          stepNumber < current
            ? "done"
            : stepNumber === current
              ? "active"
              : "upcoming";

        return (
          <li
            key={label}
            className="flex flex-1 items-center last:flex-initial"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  SpecialGhotic.className,
                  "flex h-10 w-10 shrink-0 items-center justify-center border-4 border-black text-sm",
                  state === "active" &&
                    "bg-[#FF5A1F] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  state === "done" && "bg-[#1F4B33] text-white",
                  state === "upcoming" && "bg-white text-black/40",
                )}
              >
                {state === "done" ? "✓" : stepNumber}
              </div>
              <span
                className={cn(
                  spaceMono.className,
                  "hidden text-xs uppercase tracking-widest sm:block",
                  state === "upcoming" ? "text-black/40" : "text-black",
                )}
              >
                {label}
              </span>
            </div>

            {stepNumber < steps.length && (
              <div
                className={cn(
                  "mx-3 h-1 flex-1",
                  stepNumber < current ? "bg-[#1F4B33]" : "bg-black/10",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
