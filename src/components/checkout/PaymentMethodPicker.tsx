"use client";

import { FaBolt, FaCheck, FaLock, FaQrcode, FaWallet } from "react-icons/fa";
import { FaBuildingColumns } from "react-icons/fa6";
import type { PaymentMethod } from "@/libs/actions/checkout";
import type { PaymentMethodId } from "@/libs/actions/paymentSettings";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type InstantOption = {
  id: PaymentMethod;
  label: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
  badge?: string;
};

type BankOption = {
  id: PaymentMethod;
  label: string;
  logoText: string;
  description: string;
  accent: string;
};

const INSTANT_OPTIONS: InstantOption[] = [
  {
    id: "gopay",
    label: "GoPay",
    description: "Bayar langsung dari saldo GoPay kamu",
    accent: "#00AA13",
    icon: <FaWallet size={18} />,
    badge: "Tercepat",
  },
  {
    id: "qris",
    label: "QRIS",
    description: "Scan pakai OVO, DANA, ShopeePay, atau m-banking",
    accent: "#D91E36",
    icon: <FaQrcode size={18} />,
  },
];

const BANKS: BankOption[] = [
  {
    id: "permata",
    label: "Permata Virtual Account",
    logoText: "PMT",
    description: "ATM atau PermataMobile X",
    accent: "#1F4B33",
  },
  {
    id: "mandiri",
    label: "Mandiri Virtual Account",
    logoText: "MDR",
    description: "ATM, Livin' by Mandiri, atau internet banking",
    accent: "#003D79",
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
];

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        spaceMono.className,
        "mb-2.5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-black/50",
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center text-black/40">
        {icon}
      </span>
      {children}
      <span className="h-px flex-1 bg-black/15" aria-hidden />
    </p>
  );
}

function ComingSoonRibbon() {
  return (
    <span
      className={cn(
        spaceMono.className,
        "pointer-events-none absolute right-2 top-2 border-2 border-black bg-black px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-white",
      )}
    >
      Segera hadir
    </span>
  );
}

function CheckDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black transition-colors",
        active ? "bg-black text-white" : "bg-white text-transparent",
      )}
      aria-hidden
    >
      <FaCheck size={10} />
    </span>
  );
}

function InstantCardSkeleton() {
  return (
    <div className="h-[92px] animate-pulse border-4 border-black/10 bg-black/5" />
  );
}

function BankCardSkeleton() {
  return (
    <div className="h-[68px] animate-pulse border-4 border-black/10 bg-black/5" />
  );
}

export default function PaymentMethodPicker({
  value,
  onChange,
  disabled = false,
  enabledMethods,
  loading = false,
}: {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  /**
   * Daftar metode yang lagi diaktifkan admin lewat Dashboard > Settings >
   * Metode Bayar. Kalau undefined, semua metode dianggap tersedia (dipakai
   * sebagai fallback sebelum data settings selesai di-fetch, ditutupi lewat
   * prop `loading` di bawah).
   */
  enabledMethods?: PaymentMethodId[];
  loading?: boolean;
}) {
  const isEnabled = (id: PaymentMethod) =>
    enabledMethods ? enabledMethods.includes(id) : true;

  const noneAvailable =
    !loading && enabledMethods && enabledMethods.length === 0;

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

      {noneAvailable && (
        <div className="mb-4 flex items-center gap-3 border-4 border-black bg-[#FFD400]/40 p-3">
          <FaLock className="shrink-0 text-black/60" size={14} />
          <p className={cn(spaceMono.className, "text-[11px] text-black/70")}>
            Belum ada metode pembayaran yang aktif saat ini. Hubungi panitia
            lewat halaman Kontak ya.
          </p>
        </div>
      )}

      {/* Bayar instan — GoPay & QRIS */}
      <div>
        <SectionLabel icon={<FaBolt size={10} />}>Bayar instan</SectionLabel>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {loading ? (
            <>
              <InstantCardSkeleton />
              <InstantCardSkeleton />
            </>
          ) : (
            INSTANT_OPTIONS.map((option) => {
              const isSelected = value === option.id;
              const available = isEnabled(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!available}
                  disabled={disabled || !available}
                  onClick={() => onChange(option.id)}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden border-4 border-black bg-white p-3.5 text-left transition-all duration-150",
                    "disabled:pointer-events-none disabled:opacity-45",
                    isSelected
                      ? "-translate-x-0.5 -translate-y-0.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                      : "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]",
                  )}
                  style={
                    isSelected
                      ? { backgroundColor: `${option.accent}14` }
                      : undefined
                  }
                >
                  {!available && <ComingSoonRibbon />}

                  <span
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black text-white"
                    style={{ backgroundColor: option.accent }}
                  >
                    {option.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          SpecialGhotic.className,
                          "text-sm uppercase tracking-tight text-black",
                        )}
                      >
                        {option.label}
                      </span>
                      {option.badge && available && (
                        <span
                          className={cn(
                            spaceMono.className,
                            "inline-flex items-center gap-1 border-2 border-black bg-[#FFD400] px-1 py-0.5 text-[7px] uppercase tracking-widest text-black",
                          )}
                        >
                          {option.badge}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        spaceMono.className,
                        "mt-0.5 block text-[10px] leading-snug text-black/50",
                      )}
                    >
                      {available
                        ? option.description
                        : "Belum aktif, coba metode lain dulu ya"}
                    </span>
                  </span>

                  <CheckDot active={isSelected} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Transfer VA — Permata, Mandiri, BNI, BRI */}
      <div className="mt-5">
        <SectionLabel icon={<FaBuildingColumns size={10} />}>
          Transfer virtual account
        </SectionLabel>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {loading ? (
            <>
              <BankCardSkeleton />
              <BankCardSkeleton />
              <BankCardSkeleton />
              <BankCardSkeleton />
            </>
          ) : (
            BANKS.map((bank) => {
              const isSelected = value === bank.id;
              const available = isEnabled(bank.id);

              return (
                <button
                  key={bank.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!available}
                  disabled={disabled || !available}
                  onClick={() => onChange(bank.id)}
                  className={cn(
                    "group relative flex items-center gap-3 border-4 border-black bg-white p-3 text-left transition-all duration-150",
                    "disabled:pointer-events-none disabled:opacity-45",
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
                  {!available && <ComingSoonRibbon />}

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
                      {available ? bank.description : "Belum tersedia"}
                    </span>
                  </span>

                  <CheckDot active={isSelected} />
                </button>
              );
            })
          )}
        </div>
      </div>

      <p
        className={cn(
          spaceMono.className,
          "mt-4 flex items-center justify-center gap-1.5 text-center text-[9px] uppercase tracking-widest text-black/35",
        )}
      >
        <FaLock size={9} />
        Transaksi diproses aman lewat Midtrans
      </p>
    </div>
  );
}
