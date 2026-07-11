"use client";

import { useEffect, useState } from "react";

// Minggu, 23 Agustus 2026 — 06:00 WIB (start hari-H)
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
    <section className="relative overflow-hidden border-y-4 border-ink bg-ember">
      {/* tekstur polkadot di background */}
      <div aria-hidden className="bg-polka absolute inset-0 text-ink/10" />

      <div className="relative mx-auto max-w-5xl px-6 py-10 md:py-14">
        <p className="text-center font-mono text-xs uppercase tracking-widest text-ink/70 md:text-sm">
          Menuju hari-H · minggu, 23 agustus 2026
        </p>

        <div className="mt-6 grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-0 sm:divide-x-4 sm:divide-dashed sm:divide-ink/30">
          {segments.map((seg) => (
            <div key={seg.label} className="flex flex-col items-center px-2">
              <span className="font-display text-6xl tabular-nums text-palm sm:text-7xl md:text-8xl">
                {seg.value === undefined ? "--" : pad(seg.value)}
              </span>
              <span className="mt-1 font-display text-xs uppercase tracking-widest text-palm md:text-sm">
                {seg.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
