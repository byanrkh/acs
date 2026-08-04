"use client";

import { FaCheck, FaQrcode, FaUniversity } from "react-icons/fa";
import type { PaymentMethod } from "@/libs/actions/checkout";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type MethodOption = {
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  description: string;
  icon: "bank" | "qris";
  accent: string;
  tag?: string;
};

const METHODS: MethodOption[] = [
  {
    id: "qris",
    label: "QRIS",
    shortLabel: "QRIS",
    description: "GoPay, OVO, DANA, ShopeePay, m-banking apa saja",
    icon: "qris",
    accent: "#D91E36",
    tag: "Paling cepat",
  },
  {
    id: "bca",
    label: "BCA Virtual Account",
    shortLabel: "BCA",
    description: "ATM, m-BCA, atau KlikBCA",
    icon: "bank",
    accent: "#0F4C9C",
  },
  {
    id: "bni",
    label: "BNI Virtual Account",
    shortLabel: "BNI",
    description: "ATM atau BNI Mobile Banking",
    icon: "bank",
    accent: "#F58220",
  },
  {
    id: "bri",
    label: "BRI Virtual Account",
    shortLabel: "BRI",
    description: "ATM atau BRImo",
    icon: "bank",
    accent: "#00529C",
  },
  {
    id: "permata",
    label: "Permata Virtual Account",
    shortLabel: "Permata",
    description: "ATM atau PermataMobile X",
    icon: "bank",
    accent: "#1F4B33",
  },
];

export default function PaymentMethodPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          spaceMono.className,
          "mb-2.5 text-[10px] uppercase tracking-widest text-black/50",
        )}
      >
        Pilih metode pembayaran
      </p>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {METHODS.map((method) => {
          const isSelected = value === method.id;

          return (
            <button
              key={method.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method.id)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex items-start gap-3 border-4 border-black bg-white p-3.5 text-left transition-all duration-150",
                "disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "-translate-x-0.5 -translate-y-0.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                  : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
              )}
              style={
                isSelected
                  ? { backgroundColor: `${method.accent}14` }
                  : undefined
              }
            >
              {method.tag && (
                <span
                  className={cn(
                    spaceMono.className,
                    "absolute -top-2.5 right-2 border-2 border-black bg-[#FFD400] px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-black",
                  )}
                >
                  {method.tag}
                </span>
              )}

              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black text-white"
                style={{ backgroundColor: method.accent }}
              >
                {method.icon === "bank" ? (
                  <FaUniversity size={13} />
                ) : (
                  <FaQrcode size={13} />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    SpecialGhotic.className,
                    "block text-sm uppercase tracking-tight text-black",
                  )}
                >
                  {method.label}
                </span>
                <span
                  className={cn(
                    spaceMono.className,
                    "mt-0.5 block text-[11px] leading-snug text-black/55",
                  )}
                >
                  {method.description}
                </span>
              </span>

              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-black transition-colors",
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
  );
}
