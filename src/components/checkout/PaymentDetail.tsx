"use client";

import { useState } from "react";
import {
  FaCheck,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaRegCopy,
} from "react-icons/fa";
import type { PaymentDisplay } from "@/libs/actions/checkout";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

const BANK_META: Record<string, { label: string; accent: string }> = {
  bni: { label: "BNI", accent: "#F58220" },
  bri: { label: "BRI", accent: "#00529C" },
  permata: { label: "Permata", accent: "#1F4B33" },
  mandiri: { label: "Mandiri", accent: "#003D79" },
};

const QRIS_ACCENT = "#D91E36";
const GOPAY_ACCENT = "#00AA13";

const VA_STEPS: Record<string, string[]> = {
  bni: [
    "Buka aplikasi BNI Mobile Banking atau ATM BNI.",
    "Pilih Transfer → Virtual Account Billing.",
    "Masukkan nomor Virtual Account di atas.",
    "Periksa nominal, lalu konfirmasi pembayaran.",
  ],
  bri: [
    "Buka aplikasi BRImo atau ATM BRI.",
    "Pilih Pembayaran → BRIVA.",
    "Masukkan nomor Virtual Account di atas.",
    "Periksa nominal, lalu konfirmasi pembayaran.",
  ],
  permata: [
    "Buka aplikasi PermataMobile X atau ATM Permata (bisa juga bank lain via ATM Bersama/Prima).",
    "Pilih Transfer → Virtual Account.",
    "Masukkan nomor Virtual Account di atas.",
    "Periksa nominal, lalu konfirmasi pembayaran.",
  ],
  mandiri: [
    "Buka aplikasi Livin' by Mandiri atau ATM Mandiri.",
    "Pilih Bayar → Multipayment.",
    "Masukkan Kode Perusahaan (Biller Code) di atas.",
    "Masukkan Kode Pembayaran (Bill Key), lalu konfirmasi pembayaran.",
  ],
};

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Copy button ikon-saja, dibikin nempel jadi satu kotak sama nomor VA
// (bukan pill CopyButton generik yang berdiri sendiri) supaya kelihatan
// seperti satu komponen utuh, warnanya ikut aksen bank yang lagi dipakai.
function InlineCopyButton({
  value,
  accent,
}: {
  value: string;
  accent: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (fallbackError) {
        console.error(
          "[PaymentDetail] gagal menyalin nomor VA:",
          fallbackError,
        );
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Salin nomor Virtual Account"
      style={{ backgroundColor: accent }}
      className={cn(
        spaceMono.className,
        "flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-l-4 border-black text-[9px] uppercase tracking-widest text-white transition-opacity hover:opacity-90 sm:w-20",
      )}
    >
      {copied ? <FaCheck size={13} /> : <FaRegCopy size={13} />}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

export default function PaymentDetail({
  display,
  onChangeMethod,
  changingMethod = false,
  waitingConfirmation = false,
  onManualRecheck,
  checkingStatus = false,
}: {
  display: PaymentDisplay;
  onChangeMethod: () => void;
  changingMethod?: boolean;
  waitingConfirmation?: boolean;
  onManualRecheck?: () => void;
  checkingStatus?: boolean;
}) {
  const accent =
    display.kind === "va"
      ? (BANK_META[display.bank]?.accent ?? "#000")
      : display.kind === "gopay"
        ? GOPAY_ACCENT
        : QRIS_ACCENT;
  const bankLabel =
    display.kind === "va"
      ? (BANK_META[display.bank]?.label ?? display.bank.toUpperCase())
      : "";

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div
        className="flex flex-wrap items-center justify-between gap-1.5 border-b-4 border-black px-5 py-2.5 text-white sm:px-6"
        style={{ backgroundColor: accent }}
      >
        <p
          className={cn(
            SpecialGhotic.className,
            "text-xs uppercase tracking-tight",
          )}
        >
          {display.kind === "va"
            ? `Virtual Account ${bankLabel}`
            : display.kind === "gopay"
              ? "Bayar dengan GoPay"
              : "Bayar dengan QRIS"}
        </p>
        <p
          className={cn(
            spaceMono.className,
            "text-[10px] uppercase tracking-widest opacity-90",
          )}
        >
          Berlaku s/d {formatExpiry(display.expiresAt)}
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {display.kind === "va" ? (
          <div>
            {display.bank === "mandiri" && display.billerCode && (
              <div className="mb-4">
                <p
                  className={cn(
                    spaceMono.className,
                    "text-[10px] uppercase tracking-widest text-black/50",
                  )}
                >
                  Kode Perusahaan (Biller Code)
                </p>
                <div className="mt-2 flex items-stretch border-4 border-black">
                  <div className="flex flex-1 items-center overflow-x-auto px-4 py-3">
                    <span
                      className={cn(
                        SpecialGhotic.className,
                        "select-all whitespace-nowrap text-xl tracking-widest text-black sm:text-2xl",
                      )}
                    >
                      {display.billerCode}
                    </span>
                  </div>
                  <InlineCopyButton
                    value={display.billerCode}
                    accent={accent}
                  />
                </div>
              </div>
            )}

            <p
              className={cn(
                spaceMono.className,
                "text-[10px] uppercase tracking-widest text-black/50",
              )}
            >
              {display.bank === "mandiri"
                ? "Kode Pembayaran (Bill Key)"
                : "Nomor Virtual Account"}
            </p>

            <div className="mt-2 flex items-stretch border-4 border-black">
              <div className="flex flex-1 items-center overflow-x-auto px-4 py-3">
                <span
                  className={cn(
                    SpecialGhotic.className,
                    "select-all whitespace-nowrap text-xl tracking-widest text-black sm:text-2xl",
                  )}
                >
                  {display.vaNumber}
                </span>
              </div>
              <InlineCopyButton value={display.vaNumber} accent={accent} />
            </div>

            <div className="mt-5 space-y-2">
              <p
                className={cn(
                  spaceMono.className,
                  "flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-black/50",
                )}
              >
                <FaInfoCircle size={11} /> Cara bayar
              </p>
              <ol className="space-y-1.5 pl-4 text-sm text-black/75">
                {(VA_STEPS[display.bank] ?? VA_STEPS.permata).map(
                  (step, index) => (
                    <li key={index} className="list-decimal">
                      {step}
                    </li>
                  ),
                )}
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="relative mx-auto mt-1 w-full max-w-[240px] border-4 border-black p-3">
              <span className="pointer-events-none absolute -left-1 -top-1 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />
              <span className="pointer-events-none absolute -right-1 -top-1 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />
              <span className="pointer-events-none absolute -bottom-1 -left-1 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />
              <span className="pointer-events-none absolute -bottom-1 -right-1 h-4 w-4 translate-x-1/2 translate-y-1/2 rounded-full border-4 border-black bg-[#FDF6E9]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={display.qrImageUrl}
                alt={
                  display.kind === "gopay"
                    ? "Kode QR pembayaran GoPay"
                    : "Kode QRIS pembayaran"
                }
                className="h-auto w-full"
              />
            </div>

            {display.kind === "gopay" && display.deeplinkUrl && (
              <a
                href={display.deeplinkUrl}
                className={cn(
                  spaceMono.className,
                  "mt-4 inline-flex items-center gap-2 border-2 border-black bg-[#00AA13] px-4 py-2 text-[11px] uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5",
                )}
              >
                Buka aplikasi GoPay <FaExternalLinkAlt size={10} />
              </a>
            )}

            <div className="mx-auto mt-5 max-w-sm space-y-2 text-left">
              <p
                className={cn(
                  spaceMono.className,
                  "flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-black/50",
                )}
              >
                <FaInfoCircle size={11} /> Cara bayar
              </p>
              <ol className="space-y-1.5 pl-4 text-sm text-black/75">
                {display.kind === "gopay" ? (
                  <>
                    <li className="list-decimal">
                      Buka aplikasi Gojek, lalu pilih menu GoPay.
                    </li>
                    <li className="list-decimal">
                      Tap tombol Scan/Bayar, atau tap tombol &quot;Buka aplikasi
                      GoPay&quot; di atas kalau dibuka dari HP kamu.
                    </li>
                    <li className="list-decimal">
                      Arahkan kamera ke kode QR di atas (jika scan manual).
                    </li>
                    <li className="list-decimal">
                      Periksa nominal, lalu konfirmasi pembayaran.
                    </li>
                  </>
                ) : (
                  <>
                    <li className="list-decimal">
                      Buka aplikasi GoPay, OVO, DANA, ShopeePay, atau m-banking
                      yang mendukung QRIS.
                    </li>
                    <li className="list-decimal">
                      Pilih menu Scan / Bayar QR.
                    </li>
                    <li className="list-decimal">
                      Arahkan kamera ke kode QR di atas.
                    </li>
                    <li className="list-decimal">
                      Periksa nominal, lalu konfirmasi pembayaran.
                    </li>
                  </>
                )}
              </ol>
            </div>
          </div>
        )}

        {waitingConfirmation && (
          <div className="mt-6 flex flex-col items-center gap-2 border-t-2 border-dashed border-black/15 pt-5 text-center">
            <p
              className={cn(
                spaceMono.className,
                "flex items-center gap-2 text-xs uppercase tracking-widest text-black/60",
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD400] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD400]" />
              </span>
              Menunggu konfirmasi pembayaran...
            </p>
            {onManualRecheck && (
              <button
                type="button"
                onClick={onManualRecheck}
                disabled={checkingStatus}
                className={cn(
                  spaceMono.className,
                  "text-xs underline underline-offset-2 text-black/60 hover:text-black disabled:opacity-50",
                )}
              >
                {checkingStatus ? "Mengecek..." : "Cek status sekarang"}
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onChangeMethod}
          disabled={changingMethod}
          className={cn(
            spaceMono.className,
            "mt-5 w-full text-center text-xs underline underline-offset-2 text-black/50 hover:text-black disabled:opacity-50",
          )}
        >
          {changingMethod ? "Menyiapkan..." : "Ganti metode pembayaran"}
        </button>
      </div>
    </div>
  );
}
