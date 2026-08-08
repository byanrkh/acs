"use client";

import { FaBolt, FaCheck, FaQrcode } from "react-icons/fa";
import type { PaymentMethod } from "@/libs/actions/checkout";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type BankOption = {
  id: PaymentMethod;
  label: string;
  logoText: string;
  description: string;
  accent: string;
};

const QRIS_ACCENT = "#D91E36";

const BANKS: BankOption[] = [
  {
    id: "qris",
    label: "BCA Virtual Account",
    logoText: "BCA",
    description: "ATM, m-BCA, atau KlikBCA",
    accent: "#0F4C9C",
  },
  {
    id: "bni",
    label: "BNI Virtual Account",
    logoText: "BNI",
    description: "ATM atau BNI Mobile Banking",
    accent: "#F58220",
  },
  {
    id: "bri",
    label: "BRI Virtual Account",
    logoText: "BRI",
    description: "ATM atau BRImo",
    accent: "#00529C",
  },
  {
    id: "permata",
    label: "Permata Virtual Account",
    logoText: "PMT",
    description: "ATM atau PermataMobile X",
    accent: "#1F4B33",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className={cn(
        spaceMono.className,
        "mb-2.5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/50",
      )}
    >
      <span className="h-px flex-1 bg-black/15" aria-hidden />
      {children}
      <span className="h-px flex-1 bg-black/15" aria-hidden />
    </p>
  );
}

export default function PaymentMethodPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}) {
  const isQrisSelected = value === "qris";

  return (
    <div role="radiogroup" aria-label="Pilih metode pembayaran">
      <p
        className={cn(
          spaceMono.className,
          "mb-3 text-[10px] uppercase tracking-widest text-black/50",
        )}
      >
        Pilih metode pembayaran
      </p>

      {/* QRIS — featured, full-width */}
      <button
        type="button"
        role="radio"
        aria-checked={isQrisSelected}
        disabled={disabled}
        onClick={() => onChange("qris")}
        className={cn(
          "group relative flex w-full items-center gap-4 overflow-hidden border-4 border-black bg-white p-4 text-left transition-all duration-150",
          "disabled:pointer-events-none disabled:opacity-50",
          isQrisSelected
            ? "-translate-x-0.5 -translate-y-0.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
        )}
        style={
          isQrisSelected ? { backgroundColor: `${QRIS_ACCENT}14` } : undefined
        }
      >
        {/* decorative corner slash */}
        <span
          className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rotate-45"
          style={{ backgroundColor: `${QRIS_ACCENT}1A` }}
          aria-hidden
        />

        <span
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black text-white"
          style={{ backgroundColor: QRIS_ACCENT }}
        >
          <FaQrcode size={18} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                SpecialGhotic.className,
                "text-base uppercase tracking-tight text-black",
              )}
            >
              QRIS
            </span>
            <span
              className={cn(
                spaceMono.className,
                "inline-flex items-center gap-1 border-2 border-black bg-[#FFD400] px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-black",
              )}
            >
              <FaBolt size={8} />
              Paling cepat
            </span>
          </span>
          <span
            className={cn(
              spaceMono.className,
              "mt-1 block text-[11px] leading-snug text-black/55",
            )}
          >
            GoPay, OVO, DANA, ShopeePay, atau m-banking apa saja
          </span>
        </span>

        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black transition-colors",
            isQrisSelected
              ? "bg-black text-white"
              : "bg-white text-transparent",
          )}
          aria-hidden
        >
          <FaCheck size={10} />
        </span>
      </button>

      {/* Bank VA options */}
      <div className="mt-5">
        <SectionLabel>Virtual account bank</SectionLabel>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {BANKS.map((bank) => {
            const isSelected = value === bank.id;

            return (
              <button
                key={bank.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onChange(bank.id)}
                className={cn(
                  "group relative flex items-center gap-3 border-4 border-black bg-white p-3 text-left transition-all duration-150",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isSelected
                    ? "-translate-x-0.5 -translate-y-0.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    : "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]",
                )}
                style={
                  isSelected
                    ? { backgroundColor: `${bank.accent}14` }
                    : undefined
                }
              >
                <span
                  className={cn(
                    spaceMono.className,
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-black text-[10px] font-bold tracking-tight text-white",
                  )}
                  style={{ backgroundColor: bank.accent }}
                  aria-hidden
                >
                  {bank.logoText}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      SpecialGhotic.className,
                      "block truncate text-[13px] uppercase tracking-tight text-black",
                    )}
                  >
                    {bank.logoText} VA
                  </span>
                  <span
                    className={cn(
                      spaceMono.className,
                      "mt-0.5 block truncate text-[10px] leading-snug text-black/50",
                    )}
                  >
                    {bank.description}
                  </span>
                </span>

                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-black transition-colors",
                    isSelected
                      ? "bg-black text-white"
                      : "bg-white text-transparent",
                  )}
                  aria-hidden
                >
                  <FaCheck size={9} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
