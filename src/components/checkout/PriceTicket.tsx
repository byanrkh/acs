"use client";

import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export type PriceRow = {
  label: string;
  value: string;
  tone?: "default" | "discount" | "addition";
};

export default function PriceTicket({
  rows,
  totalLabel,
  totalValue,
  stub,
  accentClassName = "bg-[#FFD400]",
}: {
  rows: PriceRow[];
  totalLabel: string;
  totalValue: string;
  stub?: { label: string; value: string } | null;
  accentClassName?: string;
}) {
  return (
    <div className="relative border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex">
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <ul className="space-y-2.5">
            {rows.map((row) => (
              <li
                key={row.label}
                className="flex items-baseline justify-between gap-4"
              >
                <span
                  className={cn(
                    spaceMono.className,
                    "text-xs text-black/55 sm:text-[13px]",
                  )}
                >
                  {row.label}
                </span>
                <span
                  className={cn(
                    spaceMono.className,
                    "text-xs sm:text-[13px]",
                    row.tone === "discount" && "text-[#1F4B33]",
                    row.tone === "addition" && "text-black/70",
                    !row.tone && "text-black",
                  )}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t-2 border-dashed border-black/20 pt-4">
            <p
              className={cn(
                spaceMono.className,
                "text-[10px] uppercase tracking-widest text-black/50",
              )}
            >
              {totalLabel}
            </p>
            <p
              className={cn(
                SpecialGhotic.className,
                "mt-1 text-3xl leading-none tracking-tight text-black sm:text-4xl",
              )}
            >
              {totalValue}
            </p>
          </div>
        </div>

        {stub && (
          <div
            className={cn(
              "relative flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-l-4 border-dashed border-black/40 px-2 py-4 text-center sm:w-32",
              accentClassName,
            )}
          >
            <span className="pointer-events-none absolute left-0 top-0 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-8 w-8 -translate-x-1/2 translate-y-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />

            <p
              className={cn(
                spaceMono.className,
                "text-[9px] uppercase leading-tight tracking-widest text-black/70",
              )}
            >
              {stub.label}
            </p>
            <p
              className={cn(
                SpecialGhotic.className,
                "w-full break-words text-center text-base leading-tight text-black sm:text-lg",
              )}
            >
              {stub.value}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
