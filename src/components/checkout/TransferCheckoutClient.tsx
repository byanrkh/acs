"use client";

import { useState } from "react";
import { FaLandmark, FaExclamationTriangle } from "react-icons/fa";
import Button from "@/components/Button";
import CopyButton from "@/components/copyButton";
import PromoInput from "@/components/checkout/PromoInput";
import PaymentStepper, {
  type PaymentStep,
} from "@/components/checkout/PaymentStepper";
import PriceTicket, { type PriceRow } from "@/components/checkout/PriceTicket";
import { getRegistrationFee } from "@/libs/config/pricing";
import { BANK_TRANSFER_INFO } from "@/libs/config/bankTransfer";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type Registration = {
  id: string;
  nama_lengkap: string;
  kategori: "pelajar" | "umum";
  status: string;
  nomor_urut: number | null;
  bukti_transfer: string | null;
  discount_amount: number;
  final_amount: number;
  promo_code: string | null;
};

function buildSteps(status: string): PaymentStep[] {
  return [
    { label: "Daftar", state: "done" },
    {
      label: "Transfer",
      state:
        status === "pending_payment"
          ? "current"
          : status === "waiting_verification" || status === "confirmed"
            ? "done"
            : "upcoming",
    },
    {
      label: "Verifikasi",
      state:
        status === "waiting_verification"
          ? "current"
          : status === "confirmed"
            ? "done"
            : "upcoming",
    },
    { label: "Lunas", state: status === "confirmed" ? "done" : "upcoming" },
  ];
}

export default function TransferCheckoutClient({
  registration,
}: {
  registration: Registration;
}) {
  const [promoCode, setPromoCode] = useState(registration.promo_code);
  const [discountAmount, setDiscountAmount] = useState(
    registration.discount_amount,
  );
  const [finalAmount, setFinalAmount] = useState(registration.final_amount);

  const subtotal = getRegistrationFee(registration.kategori);
  const uniqueCode = registration.nomor_urut ?? 0;
  const totalTransfer = finalAmount + uniqueCode;

  const canEditPromo = registration.status === "pending_payment";
  const isAwaitingAction =
    registration.status !== "confirmed" &&
    registration.status !== "waiting_verification";

  const priceRows: PriceRow[] = [
    { label: "Subtotal", value: formatRupiah(subtotal) },
    ...(discountAmount > 0
      ? [
          {
            label: `Potongan${promoCode ? ` (${promoCode})` : ""}`,
            value: `− ${formatRupiah(discountAmount)}`,
            tone: "discount" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-lg">
      <span className="inline-block -rotate-2 border-4 border-black bg-[#FFD400] px-4 py-1.5 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        Checkout Transfer Bank
      </span>

      <h1
        className={cn(
          SpecialGhotic.className,
          "mt-6 text-3xl uppercase leading-[0.95] tracking-tight text-black sm:text-4xl",
        )}
      >
        {registration.status === "confirmed"
          ? "Pembayaran berhasil"
          : registration.status === "waiting_verification"
            ? "Menunggu verifikasi"
            : "Transfer & bayar"}
      </h1>
      <p className="mt-2 text-sm text-black/60">
        {registration.nama_lengkap} · Kategori {registration.kategori}
      </p>

      <div className="mt-8 border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        <PaymentStepper steps={buildSteps(registration.status)} />
      </div>

      <div className="mt-6 space-y-6">
        {registration.status === "confirmed" && (
          <div className="border-4 border-black bg-[#1F4B33] p-5 text-center text-white">
            <p
              className={cn(
                SpecialGhotic.className,
                "uppercase tracking-tight",
              )}
            >
              Pembayaran terkonfirmasi 🎉
            </p>
            <p className="mt-3 text-sm text-white/80">
              Detail e-ticket sudah kami kirim ke email kamu.
            </p>
          </div>
        )}

        {registration.status === "waiting_verification" && (
          <div className="border-4 border-black bg-black/5 p-5 text-center">
            <p
              className={cn(
                SpecialGhotic.className,
                "uppercase tracking-tight text-black",
              )}
            >
              Bukti transfer diterima
            </p>
            <p className="mt-2 text-sm text-black/70">
              Panitia sedang memverifikasi pembayaranmu. Kamu akan menerima
              email begitu pembayaran dikonfirmasi.
            </p>
          </div>
        )}

        {isAwaitingAction && (
          <>
            {canEditPromo && (
              <PromoInput
                registrationId={registration.id}
                channel="transfer"
                appliedPromo={
                  promoCode ? { code: promoCode, discountAmount } : null
                }
                onApplied={(result) => {
                  setPromoCode(result.code);
                  setDiscountAmount(result.discountAmount);
                  setFinalAmount(result.finalAmount);
                }}
                onRemoved={(result) => {
                  setPromoCode(null);
                  setDiscountAmount(0);
                  setFinalAmount(result.finalAmount);
                }}
              />
            )}

            <PriceTicket
              rows={priceRows}
              totalLabel="Total transfer (sudah + kode unik)"
              totalValue={formatRupiah(totalTransfer)}
              stub={{ label: "Kode Unik", value: String(uniqueCode) }}
              accentClassName="bg-[#FFD400]"
            />

            <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <div className="flex items-center gap-2">
                <FaLandmark className="text-black/60" size={16} />
                <p
                  className={cn(
                    spaceMono.className,
                    "text-[11px] uppercase tracking-widest text-black/50",
                  )}
                >
                  Transfer ke rekening
                </p>
              </div>

              <p
                className={cn(
                  SpecialGhotic.className,
                  "mt-2 text-xl uppercase text-black",
                )}
              >
                {BANK_TRANSFER_INFO.bankName}
              </p>
              <p className="mt-1 text-sm text-black/60">
                a.n. {BANK_TRANSFER_INFO.accountHolder}
              </p>

              <div className="mt-3 flex justify-center">
                <CopyButton
                  value={BANK_TRANSFER_INFO.accountNumber}
                  label="Salin nomor rekening"
                />
              </div>

              <div className="mt-4 flex items-start gap-2 border-t-2 border-dashed border-black/15 pt-4 text-xs text-black/60">
                <FaExclamationTriangle
                  className="mt-0.5 shrink-0 text-[#D91E36]"
                  size={12}
                />
                <p>
                  Transfer <span className="font-bold text-black">tepat</span>{" "}
                  Rp{new Intl.NumberFormat("id-ID").format(totalTransfer)} —
                  termasuk 3 digit kode unik di atas.
                </p>
              </div>
            </div>

            <Button
              href={`/checkout/transfer/${registration.id}/upload`}
              variant="primary"
              className="w-full justify-center"
            >
              Saya Sudah Bayar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
