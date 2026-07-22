"use client";

import { useEffect, useState } from "react";
import { cn } from "@/libs/cn";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

const sizeChart = [
  { size: "XXS", chest: "46", length: "64" },
  { size: "XS", chest: "48", length: "66" },
  { size: "S", chest: "50", length: "68" },
  { size: "M", chest: "52", length: "70" },
  { size: "L", chest: "54", length: "72" },
  { size: "XL", chest: "57", length: "74" },
  { size: "2XL", chest: "60", length: "76" },
  { size: "3XL", chest: "63", length: "78" },
  { size: "4XL", chest: "66", length: "80" },
  { size: "5XL", chest: "69", length: "82" },
];

export default function SizeChartModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 border-2 border-black bg-white px-3 py-2 text-xs font-semibold uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        Lihat size chart
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Size chart jersey"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md border-4 border-black bg-[#F4F1EA] p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sm:p-8"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup size chart"
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center border-4 border-black bg-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              ✕
            </button>

            <h3
              className={cn(
                SpecialGhotic.className,
                "text-xl uppercase tracking-tight text-black sm:text-2xl",
              )}
            >
              Size chart jersey
            </h3>
            <p
              className={cn(spaceMono.className, "mt-1 text-xs text-black/60")}
            >
              Ukuran dalam sentimeter (cm)
            </p>

            <table className="mt-5 w-full border-4 border-black text-center text-sm">
              <thead>
                <tr className="bg-[#FF5A1F] text-black">
                  <th
                    className={cn(
                      SpecialGhotic.className,
                      "border-2 border-black px-3 py-2 uppercase",
                    )}
                  >
                    Ukuran
                  </th>
                  <th
                    className={cn(
                      SpecialGhotic.className,
                      "border-2 border-black px-3 py-2 uppercase",
                    )}
                  >
                    Lebar dada
                  </th>
                  <th
                    className={cn(
                      SpecialGhotic.className,
                      "border-2 border-black px-3 py-2 uppercase",
                    )}
                  >
                    Panjang baju
                  </th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row) => (
                  <tr key={row.size} className="bg-white">
                    <td className="border-2 border-black px-3 py-2 font-semibold">
                      {row.size}
                    </td>
                    <td className="border-2 border-black px-3 py-2">
                      {row.chest} cm
                    </td>
                    <td className="border-2 border-black px-3 py-2">
                      {row.length} cm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p
              className={cn(
                spaceMono.className,
                "mt-4 text-xs leading-relaxed text-black/60",
              )}
            >
              Toleransi ukuran ±2 cm karena proses produksi manual. Kalau
              ukuranmu di antara dua size, disarankan pilih yang lebih besar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
