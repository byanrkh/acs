"use client";

import { useEffect, useState } from "react";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

const TARGET_DATE = new Date("2026-08-23T06:00:00+07:00").getTime();

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(): TimeLeft {
  const diff = Math.max(TARGET_DATE - Date.now(), 0);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export default function Countdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const segments = [
    { label: "Days", value: time?.days },
    { label: "Hours", value: time?.hours },
    { label: "Minutes", value: time?.minutes },
    { label: "Seconds", value: time?.seconds },
  ];

  return (
    <section className="relative overflow-hidden border-y-4 border-black bg-[#FF5A1F]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.12) 1.6px, transparent 1.6px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-10 md:py-14">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-2.5">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1F4B33] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-black bg-[#1F4B33]" />
          </span>
          <p
            className={cn(
              spaceMono.className,
              "text-center text-xs uppercase tracking-widest text-black/70 md:text-sm",
            )}
          >
            Counting down to the big day · Sunday, 23 August 2026
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="group border-4 border-black bg-[#FDF6E9] px-2 py-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:py-6"
            >
              <span
                className={cn(
                  SpecialGhotic.className,
                  "block text-5xl tabular-nums text-[#1F4B33] sm:text-6xl md:text-7xl",
                )}
              >
                {seg.value === undefined ? "--" : pad(seg.value)}
              </span>
              <span
                className={cn(
                  spaceMono.className,
                  "mt-1 block text-[10px] uppercase tracking-widest text-[#1F4B33]/70 md:text-xs",
                )}
              >
                {seg.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
