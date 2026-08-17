"use client";

import { FaCheck } from "react-icons/fa";
import { spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export type StepState = "done" | "current" | "upcoming";

export type PaymentStep = {
  label: string;
  state: StepState;
};

export default function PaymentStepper({ steps }: { steps: PaymentStep[] }) {
  return (
    <div>
      <div className="flex">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isFinalDone = isLast && step.state === "done";

          return (
            <div key={step.label} className="relative flex-1">
              {!isLast && (
                <div
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 top-4 h-0 w-full",
                    step.state === "done"
                      ? "border-t-4 border-black"
                      : "border-t-2 border-dashed border-black/25",
                  )}
                />
              )}

              <div
                className={cn(
                  "relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-4 border-black text-[11px] font-bold",
                  isFinalDone && "bg-[#7ED957] text-black",
                  step.state === "done" &&
                    !isFinalDone &&
                    "bg-black text-white",
                  step.state === "current" && "bg-[#FFD400] text-black",
                  step.state === "upcoming" &&
                    "border-black/25 bg-white text-black/30",
                )}
              >
                {step.state === "done" ? <FaCheck size={11} /> : index + 1}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex">
        {steps.map((step) => (
          <div key={step.label} className="flex-1 px-0.5 text-center">
            <span
              className={cn(
                spaceMono.className,
                "text-[9px] uppercase tracking-widest sm:text-[10px]",
                step.state === "upcoming" ? "text-black/35" : "text-black/70",
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
