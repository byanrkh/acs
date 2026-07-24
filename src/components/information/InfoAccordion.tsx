"use client";

import { useState } from "react";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import { getRegistrationFee } from "@/libs/config/pricing";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type Section = {
  id: string;
  icon: string;
  title: string;
  accent: string;
  content: React.ReactNode;
};

const sections: Section[] = [
  {
    id: "Ketentuan Pendaftaran & Informasi Peserta",
    icon: "📋",
    accent: "bg-[#FF5A1F]",
    title: "Ketentuan Pendaftaran & Informasi Peserta",
    content: (
      <ul className="space-y-3 list-disc ml-5 text-justify">
        <li>
          Peserta wajib mengisi data diri dengan benar, akurat, dan lengkap
          sesuai dengan kartu identitas resmi (KTP/Kartu Pelajar/Paspor) saat
          melakukan pendaftaran.
        </li>
        <li>
          Tiket yang terbit akan terikat langsung dengan identitas pendaftar.
          Panitia berhak membatalkan pendaftaran jika ditemukan manipulasi data
          atau informasi palsu.
        </li>
        <li>
          Satu akun atau email dapat digunakan untuk membeli lebih dari satu
          tiket, namun data setiap peserta run harus diisi secara individual dan
          berbeda.
        </li>
      </ul>
    ),
  },
  {
    id: "Sistem Pembayaran",
    icon: "🏷️",
    accent: "bg-[#FFD400]",
    title: "Sistem Pembayaran",
    content: (
      <ul className="space-y-3 list-disc ml-5 text-justify">
        <li>
          Pembayaran tiket dilakukan secara sah menggunakan metode pembayaran
          yang tersedia melalui payment gateway resmi terintegrasi di website
          kami.
        </li>
        <li>
          Mata uang yang digunakan untuk seluruh transaksi adalah Rupiah (IDR).
        </li>
        <li>
          Peserta wajib menyelesaikan pembayaran dalam batas waktu yang
          ditentukan sistem. Jika melewati batas waktu, pesanan akan otomatis
          dibatalkan.
        </li>
      </ul>
    ),
  },
  {
    id: "Kebijakan Pengembalian Dana (Refund) & Pemindahtanganan Tiket",
    icon: "✅",
    accent: "bg-[#7ED957]",
    title: "Kebijakan Pengembalian Dana (Refund) & Pemindahtanganan Tiket",
    content: (
      <ul className="space-y-3 list-disc ml-5 text-justify">
        <li>
          <b>
            Seluruh pembelian tiket ACS Fun Run bersifat final dan personal.
          </b>
        </li>
        <li>
          Tiket yang sudah sukses dibayar{" "}
          <b>TIDAK DAPAT DIKEMBALIKAN (NON-REFUNDABLE)</b>, dibatalkan, atau
          diuangkan kembali dengan alasan apapun dari pihak peserta.
        </li>
        <li>
          <b>
            Tiket TIDAK DAPAT DIPINDAHTANGAN-KAN atau dialihkan kepada orang
            lain dengan alasan apa pun
          </b>
          . Hak kepesertaan hanya berlaku untuk nama yang tertera saat
          pendaftaran awal.
        </li>
        <li>
          Apabila terjadi kendala teknis double payment (saldo terpotong dua
          kali untuk satu pesanan yang sama), peserta dapat menghubungi
          narahubung resmi panitia dengan melampirkan bukti transfer untuk
          proses investigasi dan pengembalian manual.
        </li>
      </ul>
    ),
  },
  {
    id: "Pembatalan atau Perubahan Acara (Force Majeure)",
    icon: "🧭",
    accent: "bg-[#1F4B33] text-white",
    title: "Pembatalan atau Perubahan Acara (Force Majeure)",
    content: (
      <ul className="space-y-3 list-disc ml-5 text-justify">
        <li>
          Jika acara terpaksa ditunda atau diubah konsepnya akibat keadaan di
          luar kendali panitia (Force Majeure seperti bencana alam, cuaca
          ekstrem, kebijakan darurat pemerintah, atau izin keamanan), panitia
          akan memberikan opsi penjadwalan ulang.
        </li>
        <li>
          Kebijakan kompensasi atau pengembalian dana khusus akibat pembatalan
          total dari pihak penyelenggara akan diumumkan secara terpisah melalui
          saluran komunikasi resmi ACS.
        </li>
      </ul>
    ),
  },
  {
    id: "Kontak Kami",
    icon: "⚠️",
    accent: "bg-[#D91E36] text-white",
    title: "Kontak Kami",
    content: (
      <div className="space-y-3">
        <p>
          Jika Anda memiliki pertanyaan lebih lanjut mengenai ketentuan ini,
          silakan hubungi panitia melalui:
        </p>
        <ul className="space-y-3 list-disc ml-5 text-justify">
          <li>
            Email: <b>acs.projectalkp4@gmail.com</b>
          </li>
          <li>
            WhatsApp: <b>+62 856-9770-3733 (Gading)</b>
          </li>
        </ul>
      </div>
    ),
  },
];

export default function InfoAccordion() {
  const [openId, setOpenId] = useState<string | null>(sections[0].id);

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isOpen = openId === section.id;

        return (
          <div
            key={section.id}
            className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : section.id)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center gap-4 px-4 py-4 text-left transition-colors sm:px-6",
                isOpen ? section.accent : "bg-white hover:bg-black/[0.03]",
              )}
            >
              <span
                className={cn(
                  spaceMono.className,
                  "hidden shrink-0 text-xs opacity-60 sm:block",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-base"
              >
                {section.icon}
              </span>

              <span
                className={cn(
                  SpecialGhotic.className,
                  "flex-1 text-base uppercase tracking-tight sm:text-lg",
                )}
              >
                {section.title}
              </span>

              <span
                aria-hidden
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black text-lg font-bold transition-transform duration-200",
                  isOpen ? "rotate-45 bg-white" : "bg-white",
                )}
              >
                +
              </span>
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t-4 border-black px-4 py-5 text-sm leading-relaxed text-black/80 sm:px-6 sm:text-[15px]">
                  {section.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
