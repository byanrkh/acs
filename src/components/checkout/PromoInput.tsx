"use client";

import { useState, useTransition } from "react";
import { FaTicketAlt } from "react-icons/fa";
import {
  applyPromoToRegistration,
  removePromoFromRegistration,
} from "@/libs/actions/promo";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

export type AppliedPromo = {
  code: string;
  discountAmount: number;
};

export default function PromoInput({
  registrationId,
  channel,
  appliedPromo,
  onApplied,
  onRemoved,
  disabled = false,
}: {
  registrationId: string;
  channel: "midtrans" | "transfer";
  /** Promo yang sudah aktif di registrasi ini (kalau ada), dari server. */
  appliedPromo: AppliedPromo | null;
  onApplied: (result: {
    code: string;
    discountAmount: number;
    finalAmount: number;
  }) => void;
  onRemoved: (result: { finalAmount: number }) => void;
  /** Set true kalau status registrasi sudah tidak boleh diubah lagi. */
  disabled?: boolean;
}) {
  const [codeInput, setCodeInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    setErrorMessage(null);

    if (!codeInput.trim()) {
      setErrorMessage("Masukkan kode voucher dulu.");
      return;
    }

    startTransition(async () => {
      const result = await applyPromoToRegistration(
        registrationId,
        codeInput,
        channel,
      );

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      setCodeInput("");
      onApplied({
        code: result.code,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      });
    });
  }

  function handleRemove() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await removePromoFromRegistration(registrationId, channel);

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      onRemoved({ finalAmount: result.finalAmount });
    });
  }

  if (appliedPromo) {
    return (
      <div>
        {/* Kupon terpasang: badge robek ala voucher yang sudah dipakai. */}
        <div className="relative flex items-stretch border-4 border-black bg-white">
          <div className="flex w-11 shrink-0 items-center justify-center border-r-4 border-dashed border-black/50 bg-[#7ED957]">
            <FaTicketAlt className="text-black" size={16} />
          </div>

          <span className="pointer-events-none absolute -top-2 left-11 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />
          <span className="pointer-events-none absolute -bottom-2 left-11 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />

          <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3">
            <div>
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-sm uppercase tracking-tight text-black",
                )}
              >
                {appliedPromo.code}
              </p>
              <p
                className={cn(spaceMono.className, "text-[11px] text-black/50")}
              >
                Hemat {formatRupiah(appliedPromo.discountAmount)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending || disabled}
              className={cn(
                spaceMono.className,
                "shrink-0 text-[11px] font-bold uppercase text-[#D91E36] underline underline-offset-2 disabled:opacity-50",
              )}
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className={cn(spaceMono.className, "mt-2 text-xs text-[#D91E36]")}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-stretch gap-2">
        <div className="flex min-w-0 flex-1 items-center border-4 border-black bg-white pl-3">
          <FaTicketAlt className="shrink-0 text-black/30" size={14} />
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Punya kode voucher?"
            disabled={isPending || disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply();
              }
            }}
            className={cn(
              spaceMono.className,
              "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm uppercase text-black placeholder:normal-case placeholder:text-black/40 outline-none! focus:outline-none",
              "disabled:opacity-50",
            )}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={isPending || disabled}
          className={cn(
            SpecialGhotic.className,
            "shrink-0 border-4 border-black bg-black px-4 py-2.5 text-xs uppercase tracking-tight text-[#FDF6E9]",
            "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform duration-150",
            "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {isPending ? "..." : "Pakai"}
        </button>
      </div>

      {errorMessage && (
        <p className={cn(spaceMono.className, "mt-2 text-xs text-[#D91E36]")}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
