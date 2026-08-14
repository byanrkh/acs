"use client";

import Script from "next/script";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaClock,
  FaInfoCircle,
  FaLock,
  FaSpinner,
  FaWhatsapp,
} from "react-icons/fa";
import { CONTACT_INFO } from "@/libs/config/contact";
import Button from "@/components/Button";
import PromoInput from "@/components/promo/PromoInput";
import PaymentStepper, {
  type PaymentStep,
} from "@/components/checkout/PaymentStepper";
import PriceTicket, { type PriceRow } from "@/components/checkout/PriceTicket";
import ParticipantDataCard from "@/components/checkout/ParticipantDataCard";
import {
  checkAndExpireIfPastDeadline,
  createPaymentTransaction,
  reconcilePaymentStatus,
} from "@/libs/actions/checkout";
import { getRegistrationFee } from "@/libs/config/pricing";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

// Snap.js nyuntik `window.snap` secara global setelah script-nya kelar
// dimuat. Deklarasi minimal callback yang kita pakai — Snap sebenarnya
// ngirim lebih banyak field di objek result, tapi kita cuma butuh momen
// (success/pending/error/close)-nya, bukan detail isinya (status final
// tetap kita ambil dari DB lewat reconcilePaymentStatus/webhook).
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

const SNAP_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
const SNAP_IS_PRODUCTION =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
const SNAP_JS_SRC = SNAP_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/snap.js" // production
  : "https://app.sandbox.midtrans.com/snap/snap.js"; // sandbox

type Registration = {
  id: string;
  nama_lengkap: string;
  email: string;
  telepon: string;
  nisn: string | null;
  nik_terakhir: string | null;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P";
  golongan_darah: string;
  riwayat_penyakit: string | null;
  kontak_darurat_nama: string;
  kontak_darurat_telepon: string;
  nama_bib: string;
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
// nunggu VA/QRIS/GoPay ke-settle di sandbox atau kasus normal di
// production, tanpa nge-hammer server actions kalau user ninggalin tab
// kebuka lama.
const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 5000;

export default function CheckoutClient({
  registration,
  hasPaymentMethod,
}: {
  registration: Registration;
  /**
   * Apakah ADA MINIMAL SATU metode pembayaran yang lagi aktif menurut
   * Dashboard > Settings > Metode Bayar. UI pemilihan metode sendiri
   * sepenuhnya di-render oleh popup Snap, jadi kita nggak perlu tahu
   * daftar lengkapnya lagi di sini — cukup tahu boleh/tidaknya tombol
   * "Bayar Sekarang" diklik.
   */
  hasPaymentMethod: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(registration.status);
  const [bibNumber, setBibNumber] = useState(registration.bib_number);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [snapReady, setSnapReady] = useState(false);

  // Ditandain lewat query `?resumed=1` dari submitRegistration ketika
  // duplicate-check nemu pendaftaran lama dengan NISN/NIK yang sama, dan
  // langsung ngarahin ke sini alih-alih bikin pendaftaran baru. Query-nya
  // langsung dibuang dari URL begitu dibaca supaya tidak nongol lagi kalau
  // halaman ini di-refresh atau di-bookmark/dibagikan.
  const [showResumedBanner, setShowResumedBanner] = useState(false);
  useEffect(() => {
    if (searchParams.get("resumed") !== "1") return;
    setShowResumedBanner(true);
    router.replace(`/checkout/${registration.id}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Field peserta yang bisa berubah lewat "Edit Data" dan dipakai juga di
  // luar ParticipantDataCard (subtitle header di bawah). Field lain yang
  // ikut diedit (tempat lahir, golongan darah, dst) cukup dikelola secara
  // lokal di dalam ParticipantDataCard sendiri, karena tidak ditampilkan
  // di luar kartu itu.
  const [namaLengkap, setNamaLengkap] = useState(registration.nama_lengkap);
  const [ukuranJersey, setUkuranJersey] = useState(registration.ukuran_jersey);

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
  const canEditParticipantData =
    status === "pending_payment" || status === "expired";

  useEffect(() => {
    if (status !== "pending_payment") {
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
    if (!hasPaymentMethod) {
      setErrorMessage(
        "Belum ada metode pembayaran yang aktif saat ini. Hubungi panitia lewat halaman Kontak ya.",
      );
      return;
    }

    if (!snapReady || typeof window === "undefined" || !window.snap) {
      setErrorMessage(
        "Modul pembayaran belum siap dimuat, tunggu sebentar lalu coba lagi.",
      );
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await createPaymentTransaction(registration.id);

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      // Popup Snap yang render pilihan GoPay/QRIS/VA/dll + status
      // sukses/pending/gagal-nya sendiri. Kita cuma perlu tahu MOMENnya
      // buat mulai polling status ke DB (status final tetap sumber
      // kebenarannya dari webhook + reconcilePaymentStatus, bukan dari
      // callback ini, supaya konsisten dengan halaman kalau di-reload).
      window.snap!.pay(result.snap.token, {
        onSuccess: () => setWaitingConfirmation(true),
        onPending: () => setWaitingConfirmation(true),
        onError: () => {
          setErrorMessage("Pembayaran gagal diproses. Coba lagi ya.");
        },
        onClose: () => {
          setErrorMessage(
            'Kamu menutup jendela pembayaran sebelum selesai. Klik "Bayar Sekarang" lagi kalau mau lanjut.',
          );
        },
      });
    });
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
      {SNAP_CLIENT_KEY && (
        <Script
          src={SNAP_JS_SRC}
          data-client-key={SNAP_CLIENT_KEY}
          strategy="afterInteractive"
          onLoad={() => setSnapReady(true)}
        />
      )}

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
        {namaLengkap} · Kategori {registration.kategori} · Jersey {ukuranJersey}
      </p>

      <div className="mt-8 border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        <PaymentStepper steps={buildSteps(status)} />
      </div>

      <div className="mt-6 space-y-6">
        {showResumedBanner && (
          <div className="flex items-start gap-3 border-4 border-black bg-[#FFD400] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <FaInfoCircle className="mt-0.5 shrink-0 text-black" size={16} />
            <div className="flex-1">
              <p
                className={cn(
                  spaceMono.className,
                  "text-xs font-bold uppercase tracking-tight text-black",
                )}
              >
                Kamu sudah pernah daftar
              </p>
              <p className="mt-1 text-xs text-black/70">
                NISN/NIK ini sudah pernah dipakai daftar sebelumnya, jadi kami
                arahkan ke pendaftaran sebelumnya.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResumedBanner(false)}
              aria-label="Tutup pemberitahuan"
              className="shrink-0 text-black/50 hover:text-black"
            >
              ✕
            </button>
          </div>
        )}

        <ParticipantDataCard
          registrationId={registration.id}
          kategori={registration.kategori}
          identifierLabel={
            registration.kategori === "pelajar"
              ? "NISN"
              : "4 digit terakhir NIK"
          }
          identifierValue={
            registration.kategori === "pelajar"
              ? (registration.nisn ?? "-")
              : (registration.nik_terakhir ?? "-")
          }
          editable={canEditParticipantData}
          data={{
            namaLengkap: registration.nama_lengkap,
            email: registration.email,
            telepon: registration.telepon,
            tempatLahir: registration.tempat_lahir,
            tanggalLahir: registration.tanggal_lahir,
            jenisKelamin: registration.jenis_kelamin,
            golonganDarah: registration.golongan_darah,
            riwayatPenyakit: registration.riwayat_penyakit,
            kontakDaruratNama: registration.kontak_darurat_nama,
            kontakDaruratTelepon: registration.kontak_darurat_telepon,
            ukuranJersey: registration.ukuran_jersey,
            namaBib: registration.nama_bib,
          }}
          onUpdated={(patch) => {
            setNamaLengkap(patch.namaLengkap);
            setUkuranJersey(patch.ukuranJersey);
          }}
        />

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

            <div className="mt-5 border-t-2 border-dashed border-white/25 pt-5">
              <p className="text-xs text-white/80">
                Satu langkah lagi — gabung channel WhatsApp resmi kami biar
                nggak ketinggalan info race pack, jadwal, dan pengumuman penting
                lainnya.
              </p>
              <a
                href={CONTACT_INFO.whatsappChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  SpecialGhotic.className,
                  "mt-4 inline-flex w-full items-center justify-center gap-2 border-4 border-black bg-[#25D366] px-4 py-3 text-sm uppercase tracking-tight text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                )}
              >
                <FaWhatsapp size={18} />
                Gabung Channel WhatsApp ACS
              </a>
            </div>
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

            {!hasPaymentMethod && (
              <div className="flex items-center gap-3 border-4 border-black bg-[#FFD400]/40 p-3">
                <p
                  className={cn(
                    spaceMono.className,
                    "text-[11px] text-black/70",
                  )}
                >
                  Belum ada metode pembayaran yang aktif saat ini. Hubungi
                  panitia lewat halaman Kontak ya.
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

            {waitingConfirmation ? (
              <div className="border-4 border-black bg-white p-5 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <p
                  className={cn(
                    spaceMono.className,
                    "flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-black/60",
                  )}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD400] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD400]" />
                  </span>
                  Menunggu konfirmasi pembayaran...
                </p>
                <button
                  type="button"
                  onClick={handleManualRecheck}
                  disabled={isPending}
                  className={cn(
                    spaceMono.className,
                    "mt-3 text-xs underline underline-offset-2 text-black/60 hover:text-black disabled:opacity-50",
                  )}
                >
                  {isPending ? "Mengecek..." : "Cek status sekarang"}
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center gap-2"
                onClick={handlePay}
                disabled={isPending || !hasPaymentMethod}
              >
                {isPending && <FaSpinner className="animate-spin" size={14} />}
                {isPending
                  ? "Menghubungi Midtrans..."
                  : status === "expired"
                    ? "Bayar ulang"
                    : "Bayar Sekarang"}
              </Button>
            )}

            <p
              className={cn(
                spaceMono.className,
                "flex items-center justify-center gap-1.5 text-center text-[9px] uppercase tracking-widest text-black/35",
              )}
            >
              <FaLock />
              Transaksi diproses aman melalui Midtrans
            </p>
          </>
        )}
      </div>
    </div>
  );
}
