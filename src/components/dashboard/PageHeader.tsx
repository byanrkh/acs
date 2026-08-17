"use client";

import { useEffect, useState } from "react";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const now = useLiveClock();
  const timeLabel = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const dateLabel = now
    ? now.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";

  return (
    <div className="relative overflow-hidden border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div
        aria-hidden
        className="h-1.5 w-full bg-[repeating-linear-gradient(90deg,#000_0,#000_10px,transparent_10px,transparent_20px)] opacity-80"
      />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                spaceMono.className,
                "border-2 border-black bg-[#FFD400] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black sm:text-[10px]",
              )}
            >
              {eyebrow}
            </p>
          </div>

          <h1
            className={cn(
              SpecialGhotic.className,
              "mt-2 text-2xl uppercase leading-tight tracking-tight sm:text-3xl lg:text-4xl",
            )}
          >
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-xl text-sm text-black/60">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 self-stretch sm:self-auto">
          {/* Jam kecil ala "boarding pass" — dekoratif, sekaligus nunjukin panel real-time */}
          <div className="hidden flex-col items-end border-2 border-black/10 bg-[#FDF6E9] px-3 py-1.5 sm:flex">
            <span
              className={cn(
                SpecialGhotic.className,
                "text-lg leading-none tracking-tight",
              )}
            >
              {timeLabel}
            </span>
            <span
              className={cn(
                spaceMono.className,
                "mt-0.5 text-[9px] uppercase tracking-widest text-black/40",
              )}
            >
              {dateLabel}
            </span>
          </div>

          {action && <div>{action}</div>}
        </div>
      </div>
    </div>
  );
}
