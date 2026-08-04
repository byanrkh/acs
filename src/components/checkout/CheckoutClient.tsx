"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { FaClock, FaSpinner } from "react-icons/fa";
import Button from "@/components/Button";
import PromoInput from "@/components/checkout/PromoInput";
import PaymentStepper, {
  type PaymentStep,
} from "@/components/checkout/PaymentStepper";
import PriceTicket, { type PriceRow } from "@/components/checkout/PriceTicket";
import PaymentMethodPicker from "@/components/checkout/PaymentMethodPicker";
import PaymentDetail from "@/components/checkout/PaymentDetail";
import {
  checkAndExpireIfPastDeadline,
  createPaymentTransaction,
  reconcilePaymentStatus,
  type PaymentDisplay,
  type PaymentMethod,
} from "@/libs/actions/checkout";
import { getRegistrationFee } from "@/libs/config/pricing";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Registration = {
  id: string;
  nama_lengkap: string;
  email: string;
  kategori: "pelajar" | "umum";
  ukuran_jersey: string;
  status: string;
  midtrans_order_id: string | null;
  payment_expires_at: string | null;
  bib_number: string | null;
  discount_amount: number;
  final_amount: number;
  promo_code: string | null;
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildSteps(status: string): PaymentStep[] {
  return [
    { label: "Daftar", state: "done" },
    {
      label: "Bayar",
      state:
        status === "pending_payment" || status === "expired"
          ? "current"
          : status === "confirmed"
            ? "done"
            : "upcoming",
    },
    {
      label: "Terkonfirmasi",
      state: status === "confirmed" ? "done" : "upcoming",
    },
  ];
}

function useCountdown(target: string | null) {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!target) return;
    const targetMs = new Date(target).getTime();
    const tick = () => setMsLeft(Math.max(targetMs - Date.now(), 0));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (msLeft === null) return null;

  return {
    hours: Math.floor(msLeft / 3_600_000),
    minutes: Math.floor((msLeft / 60_000) % 60),
    seconds: Math.floor((msLeft / 1_000) % 60),
    expired: msLeft <= 0,
  };
}

// Berapa kali polling otomatis jalan sebelum berhenti dan nyerahin ke
// tombol "Cek status sekarang". 60x @ 5 detik = 5 menit -- cukup buat
// nunggu VA/QRIS ke-settle di sandbox atau kasus normal di production,
// tanpa nge-hammer server actions kalau user ninggalin tab kebuka lama.
const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 5000;

export default function CheckoutClient({
  registration,
}: {
  registration: Registration;
}) {
  const [status, setStatus] = useState(registration.status);
  const [bibNumber, setBibNumber] = useState(registration.bib_number);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [paymentDisplay, setPaymentDisplay] = useState<PaymentDisplay | null>(
    null,
  );

  const [promoCode, setPromoCode] = useState(registration.promo_code);
  const [discountAmount, setDiscountAmount] = useState(
    registration.discount_amount,
  );
  const [finalAmount, setFinalAmount] = useState(registration.final_amount);

  const subtotal = useMemo(
    () => getRegistrationFee(registration.kategori),
    [registration.kategori],
  );

  const countdown = useCountdown(
    status === "pending_payment" ? registration.payment_expires_at : null,
  );

  const canEditPromo = status === "pending_payment" || status === "expired";

  // Kalau status berubah (misal jadi confirmed/expired dari polling atau
  // reload), kode pembayaran lama (VA/QRIS) udah gak relevan lagi.
  useEffect(() => {
    if (status !== "pending_payment") {
      setPaymentDisplay(null);
      setWaitingConfirmation(false);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "pending_payment") return;
    startTransition(async () => {
      const result = await checkAndExpireIfPastDeadline(registration.id);
      if (result) setStatus(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pollOnce() {
    const latest = await reconcilePaymentStatus(registration.id);
    if (latest.status && latest.status !== "pending_payment") {
      setStatus(latest.status);
      if (latest.bibNumber) setBibNumber(latest.bibNumber);
      setWaitingConfirmation(false);
      return true;
    }
    return false;
  }

  useEffect(() => {
    if (!waitingConfirmation) return;

    let cancelled = false;
    let attempts = 0;

    (async () => {
      const done = await pollOnce();
      if (done || cancelled) return;

      const id = setInterval(async () => {
        attempts += 1;
        const finished = await pollOnce();
        if (finished || attempts >= MAX_POLL_ATTEMPTS) {
          clearInterval(id);
          if (!finished) setWaitingConfirmation(false);
        }
      }, POLL_INTERVAL_MS);

      return () => clearInterval(id);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingConfirmation]);

  function handlePay() {
    if (!selectedMethod) {
      setErrorMessage("Pilih metode pembayaran dulu ya.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await createPaymentTransaction(
        registration.id,
        selectedMethod,
      );

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setPaymentDisplay(result.display);
      setWaitingConfirmation(true);
    });
  }

  function handleChangeMethod() {
    setPaymentDisplay(null);
    setWaitingConfirmation(false);
    setErrorMessage(null);
  }

  function handleManualRecheck() {
    setErrorMessage(null);
    startTransition(async () => {
      const found = await pollOnce();
      if (!found) {
        setErrorMessage(
          "Status masih menunggu pembayaran. Kalau kamu sudah bayar, tunggu sebentar lalu coba cek lagi.",
        );
      }
    });
  }

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
    <div>
      <span className="inline-block -rotate-2 border-4 border-black bg-[#FFD400] px-4 py-1.5 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        Checkout
      </span>

      <h1
        className={cn(
          SpecialGhotic.className,
          "mt-6 text-3xl uppercase leading-[0.95] tracking-tight text-black sm:text-4xl",
        )}
      >
        {status === "confirmed"
          ? "Pembayaran berhasil"
          : "Selesaikan pembayaran"}
      </h1>
      <p className="mt-2 text-sm text-black/60">
        {registration.nama_lengkap} · Kategori {registration.kategori} · Jersey{" "}
        {registration.ukuran_jersey}
      </p>

      <div className="mt-8 border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        <PaymentStepper steps={buildSteps(status)} />
      </div>

      <div className="mt-6 space-y-6">
        {status === "confirmed" ? (
          <div className="border-4 border-black bg-[#1F4B33] p-5 text-center text-white">
            <p
              className={cn(
                SpecialGhotic.className,
                "uppercase tracking-tight",
              )}
            >
              Pembayaran terkonfirmasi 🎉
            </p>
            {bibNumber && (
              <div className="mt-4 border-2 border-white/40 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-white/70">
                  Nomor BIB kamu
                </p>
                <p className={cn(SpecialGhotic.className, "mt-1 text-2xl")}>
                  {bibNumber}
                </p>
              </div>
            )}
            <p className="mt-3 text-sm text-white/80">
              Detail juga sudah kami kirim ke email kamu.
            </p>
          </div>
        ) : status === "cancelled" ? (
          <div className="border-4 border-black bg-black/5 p-4 text-center">
            <p
              className={cn(
                SpecialGhotic.className,
                "uppercase tracking-tight text-black",
              )}
            >
              Pembayaran dibatalkan
            </p>
          </div>
        ) : (
          <>
            {canEditPromo && (
              <PromoInput
                registrationId={registration.id}
                channel="midtrans"
                appliedPromo={
                  promoCode ? { code: promoCode, discountAmount } : null
                }
                onApplied={(result) => {
                  setPromoCode(result.code);
                  setDiscountAmount(result.discountAmount);
                  setFinalAmount(result.finalAmount);
                  // Kode pembayaran (VA/QRIS) lama udah nyimpen gross_amount
                  // sebelum promo diterapkan -> paksa bikin transaksi baru
                  // saat "Bayar" berikutnya diklik supaya nominal ikut update.
                  setPaymentDisplay(null);
                }}
                onRemoved={(result) => {
                  setPromoCode(null);
                  setDiscountAmount(0);
                  setFinalAmount(result.finalAmount);
                  setPaymentDisplay(null);
                }}
              />
            )}

            <PriceTicket
              rows={priceRows}
              totalLabel="Total bayar"
              totalValue={formatRupiah(finalAmount)}
              stub={
                registration.midtrans_order_id
                  ? {
                      label: "Order",
                      value: registration.midtrans_order_id
                        .slice(-6)
                        .toUpperCase(),
                    }
                  : null
              }
              accentClassName="bg-[#7ED957]"
            />

            {status === "pending_payment" &&
              countdown &&
              !countdown.expired && (
                <div className="flex items-center justify-center gap-2 border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <FaClock className="text-black/50" size={13} />
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-xs uppercase tracking-widest text-black/60",
                    )}
                  >
                    Sisa waktu bayar: {String(countdown.hours).padStart(2, "0")}
                    :{String(countdown.minutes).padStart(2, "0")}:
                    {String(countdown.seconds).padStart(2, "0")}
                  </p>
                </div>
              )}

            {(status === "expired" ||
              (countdown?.expired && status === "pending_payment")) && (
              <div className="border-4 border-[#D91E36] bg-[#D91E36]/10 p-4 text-center">
                <p
                  className={cn(
                    SpecialGhotic.className,
                    "uppercase tracking-tight text-[#D91E36]",
                  )}
                >
                  Waktu pembayaran habis
                </p>
                <p className="mt-1 text-sm text-black/70">
                  Pendaftaran ini sudah kedaluwarsa. Kamu bisa coba bayar ulang.
                </p>
              </div>
            )}

            {errorMessage && (
              <p
                className={cn(
                  spaceMono.className,
                  "text-center text-xs text-[#D91E36]",
                )}
              >
                {errorMessage}
              </p>
            )}

            {paymentDisplay ? (
              <PaymentDetail
                display={paymentDisplay}
                onChangeMethod={handleChangeMethod}
                changingMethod={isPending}
                waitingConfirmation={waitingConfirmation}
                onManualRecheck={handleManualRecheck}
                checkingStatus={isPending}
              />
            ) : (
              <div className="space-y-4">
                <PaymentMethodPicker
                  value={selectedMethod}
                  onChange={setSelectedMethod}
                  disabled={isPending}
                />

                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center gap-2"
                  onClick={handlePay}
                  disabled={isPending || !selectedMethod}
                >
                  {isPending && (
                    <FaSpinner className="animate-spin" size={14} />
                  )}
                  {isPending
                    ? "Menghubungi Midtrans..."
                    : status === "expired"
                      ? "Bayar ulang"
                      : "Buat kode pembayaran"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
