"use client";

import Script from "next/script";
import { useEffect, useMemo, useState, useTransition } from "react";
import Button from "@/components/Button";
import {
  checkAndExpireIfPastDeadline,
  createSnapTransaction,
  getRegistrationStatus,
} from "@/libs/actions/checkout";
import { getRegistrationFee } from "@/libs/config/pricing";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

type Registration = {
  id: string;
  nama_lengkap: string;
  email: string;
  kategori: "pelajar" | "umum";
  ukuran_jersey: string;
  status: string;
  midtrans_order_id: string | null;
  payment_expires_at: string | null;
};

const SNAP_SRC =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
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

export default function CheckoutClient({
  registration,
}: {
  registration: Registration;
}) {
  const [status, setStatus] = useState(registration.status);
  const [snapReady, setSnapReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();

  const grossAmount = useMemo(
    () => getRegistrationFee(registration.kategori),
    [registration.kategori],
  );
  const countdown = useCountdown(
    status === "pending_payment" ? registration.payment_expires_at : null,
  );

  // Self-heal: kalau deadline udah lewat pas halaman dibuka tapi status
  // masih pending_payment (webhook belum sempat jalan), sinkronkan manual.
  useEffect(() => {
    if (status !== "pending_payment") return;
    startTransition(async () => {
      const result = await checkAndExpireIfPastDeadline(registration.id);
      if (result) setStatus(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling ringan setelah user selesai di popup Snap, nunggu webhook
  // Midtrans update status di database (maks ~2 menit).
  useEffect(() => {
    if (!waitingConfirmation) return;
    let attempts = 0;
    const id = setInterval(async () => {
      attempts += 1;
      const latest = await getRegistrationStatus(registration.id);
      if (latest && latest !== "pending_payment") {
        setStatus(latest);
        setWaitingConfirmation(false);
        clearInterval(id);
      }
      if (attempts >= 24) {
        clearInterval(id);
        setWaitingConfirmation(false);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [waitingConfirmation, registration.id]);

  function handlePay() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await createSnapTransaction(registration.id);

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      if (!window.snap) {
        setErrorMessage("Snap belum siap, coba refresh halaman.");
        return;
      }

      window.snap.pay(result.token, {
        onSuccess: () => setWaitingConfirmation(true),
        onPending: () => setWaitingConfirmation(true),
        onError: () => setErrorMessage("Pembayaran gagal, coba lagi."),
        onClose: () => {
          // User nutup popup tanpa nyelesein — token/order_id masih valid,
          // tombol "Bayar sekarang" bisa dipencet lagi.
        },
      });
    });
  }

  return (
    <div>
      <Script
        src={SNAP_SRC}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        onLoad={() => setSnapReady(true)}
      />

      <span className="inline-block -rotate-2 border-4 border-black bg-[#FFD400] px-4 py-1.5 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        Checkout
      </span>

      <h1
        className={cn(
          SpecialGhotic.className,
          "mt-6 text-3xl uppercase leading-[0.95] tracking-tight text-black sm:text-4xl",
        )}
      >
        Selesaikan pembayaran
      </h1>

      <div className="mt-8 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-8">
        <table className="w-full border-4 border-black text-sm">
          <tbody>
            <tr>
              <td className="border-2 border-black bg-[#FDF6E9] px-3 py-2 font-medium text-black/60">
                Nama
              </td>
              <td className="border-2 border-black px-3 py-2 text-black">
                {registration.nama_lengkap}
              </td>
            </tr>
            <tr>
              <td className="border-2 border-black bg-[#FDF6E9] px-3 py-2 font-medium text-black/60">
                Kategori
              </td>
              <td className="border-2 border-black px-3 py-2 capitalize text-black">
                {registration.kategori}
              </td>
            </tr>
            <tr>
              <td className="border-2 border-black bg-[#FDF6E9] px-3 py-2 font-medium text-black/60">
                Ukuran jersey
              </td>
              <td className="border-2 border-black px-3 py-2 text-black">
                {registration.ukuran_jersey}
              </td>
            </tr>
            <tr>
              <td className="border-2 border-black bg-[#FDF6E9] px-3 py-2 font-bold text-black">
                Total bayar
              </td>
              <td
                className={cn(
                  SpecialGhotic.className,
                  "border-2 border-black px-3 py-2 text-lg text-black",
                )}
              >
                {formatRupiah(grossAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        {status === "pending_payment" && countdown && !countdown.expired && (
          <p
            className={cn(
              spaceMono.className,
              "mt-4 text-center text-xs uppercase tracking-widest text-black/60",
            )}
          >
            Sisa waktu bayar: {String(countdown.hours).padStart(2, "0")}:
            {String(countdown.minutes).padStart(2, "0")}:
            {String(countdown.seconds).padStart(2, "0")}
          </p>
        )}

        {status === "confirmed" && (
          <div className="mt-6 border-4 border-black bg-[#1F4B33] p-4 text-center text-white">
            <p
              className={cn(
                SpecialGhotic.className,
                "uppercase tracking-tight",
              )}
            >
              Pembayaran terkonfirmasi
            </p>
            <p className="mt-1 text-sm text-white/80">
              Nomor BIB kamu akan dikirim menyusul lewat email.
            </p>
          </div>
        )}

        {(status === "expired" ||
          (countdown?.expired && status === "pending_payment")) && (
          <div className="mt-6 border-4 border-[#D91E36] bg-[#D91E36]/10 p-4 text-center">
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

        {status === "cancelled" && (
          <div className="mt-6 border-4 border-black bg-black/5 p-4 text-center">
            <p
              className={cn(
                SpecialGhotic.className,
                "uppercase tracking-tight text-black",
              )}
            >
              Pembayaran dibatalkan
            </p>
          </div>
        )}

        {waitingConfirmation && (
          <p
            className={cn(
              spaceMono.className,
              "mt-4 text-center text-xs uppercase tracking-widest text-black/60",
            )}
          >
            Menunggu konfirmasi dari sistem pembayaran...
          </p>
        )}

        {errorMessage && (
          <p
            className={cn(
              spaceMono.className,
              "mt-4 text-center text-xs text-[#D91E36]",
            )}
          >
            {errorMessage}
          </p>
        )}

        {(status === "pending_payment" || status === "expired") && (
          <Button
            type="button"
            variant="primary"
            className="mt-6 w-full justify-center text-[#004D3D]"
            onClick={handlePay}
            disabled={isPending || !snapReady}
          >
            {isPending
              ? "Menyiapkan pembayaran..."
              : status === "expired"
                ? "Bayar ulang"
                : "Bayar sekarang"}
          </Button>
        )}
      </div>
    </div>
  );
}
