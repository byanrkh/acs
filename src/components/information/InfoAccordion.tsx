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
    id: "pendaftaran",
    icon: "📋",
    accent: "bg-[#FF5A1F]",
    title: "Pendaftaran",
    content: (
      <div className="space-y-3">
        <p>
          Pendaftaran ACS 2026 dibuka secara online melalui halaman{" "}
          <span className="font-bold">Registration</span>. Isi data diri, pilih
          kategori peserta, lalu selesaikan pembayaran untuk mengamankan slot
          dan nomor BIB kamu.
        </p>
        <p>
          Setiap peserta hanya berhak atas{" "}
          <span className="font-bold">satu slot</span> pendaftaran. Pastikan
          seluruh data — nama, NISN/NIK, dan nama yang ingin dicetak di BIB —
          sudah benar sebelum submit, karena perubahan data setelah pembayaran
          dikonfirmasi tidak dapat dijamin.
        </p>
        <p>
          Slot terbatas dan dibuka dengan sistem{" "}
          <span className="font-bold">first come, first served</span>. Begitu
          kuota di suatu kategori penuh, pendaftaran kategori tersebut otomatis
          ditutup — jadi jangan tunda-tunda pendaftaranmu.
        </p>
      </div>
    ),
  },
  {
    id: "kategori",
    icon: "🏷️",
    accent: "bg-[#FFD400]",
    title: "Kategori & Biaya Registrasi",
    content: (
      <div className="space-y-4">
        <p>
          ACS 2026 terbuka untuk dua kategori peserta, masing-masing dengan alur
          verifikasi dan biaya registrasi yang berbeda:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="border-2 border-black/20 bg-black/[0.03] p-4">
            <p className="font-bold uppercase tracking-tight">Pelajar</p>
            <p className="mt-1 text-sm text-black/70">
              Untuk siswa/siswi aktif, verifikasi menggunakan 10 digit NISN.
            </p>
            <p className={cn(spaceMono.className, "mt-3 text-lg font-bold")}>
              {formatRupiah(getRegistrationFee("pelajar"))}
            </p>
          </div>
          <div className="border-2 border-black/20 bg-black/[0.03] p-4">
            <p className="font-bold uppercase tracking-tight">Umum</p>
            <p className="mt-1 text-sm text-black/70">
              Untuk peserta umum, verifikasi menggunakan 4 digit akhir NIK.
            </p>
            <p className={cn(spaceMono.className, "mt-3 text-lg font-bold")}>
              {formatRupiah(getRegistrationFee("umum"))}
            </p>
          </div>
        </div>
        <p className="text-sm text-black/60">
          Biaya registrasi sudah termasuk race pack (jersey + nomor BIB) dan
          e-sertifikat. Jersey tersedia ukuran S sampai XXL — cek size chart di
          halaman pendaftaran sebelum memilih ukuran.
        </p>
      </div>
    ),
  },
  {
    id: "peserta",
    icon: "✅",
    accent: "bg-[#7ED957]",
    title: "Ketentuan Umum Peserta",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Peserta wajib dalam kondisi sehat jasmani dan rohani pada hari
          pelaksanaan acara.
        </li>
        <li>
          Wajib mengisi data kesehatan (golongan darah, riwayat penyakit) dan
          kontak darurat dengan jujur saat pendaftaran — data ini krusial untuk
          penanganan cepat tim medis jika dibutuhkan.
        </li>
        <li>
          Wajib menggunakan jersey resmi dan menyematkan nomor BIB di bagian
          depan yang terlihat jelas selama acara berlangsung.
        </li>
        <li>
          Race pack (jersey, BIB, dan perlengkapan lain) wajib diambil sendiri
          oleh peserta pada jadwal pengambilan yang diinformasikan melalui email
          — bawa QR code konfirmasi dan identitas diri.
        </li>
        <li>
          Panitia berhak mendiskualifikasi peserta yang terbukti melanggar
          ketentuan atau bertindak tidak sportif.
        </li>
      </ul>
    ),
  },
  {
    id: "pelaksana",
    icon: "🧭",
    accent: "bg-[#1F4B33] text-white",
    title: "Ketentuan Umum Pelaksana Acara",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Panitia berhak melakukan perubahan jadwal, rute, atau teknis
          pelaksanaan apabila terjadi kondisi force majeure (cuaca ekstrem,
          keadaan darurat, kebijakan pemerintah, dll).
        </li>
        <li>
          Segala perubahan akan diinformasikan sesegera mungkin melalui email
          terdaftar dan kanal resmi ACS 2026.
        </li>
        <li>
          Panitia menyediakan pos kesehatan dan tim medis di titik-titik
          strategis sepanjang jalur acara.
        </li>
        <li>
          Dokumentasi (foto/video) selama acara dapat digunakan panitia untuk
          keperluan publikasi dan arsip resmi ACS 2026.
        </li>
      </ul>
    ),
  },
  {
    id: "penting",
    icon: "⚠️",
    accent: "bg-[#D91E36] text-white",
    title: "Informasi Penting",
    content: (
      <div className="space-y-3">
        <p>
          Biaya registrasi yang sudah dibayarkan{" "}
          <span className="font-bold">
            tidak dapat dikembalikan (non-refundable)
          </span>{" "}
          dan tidak dapat dipindahtangankan ke peserta lain dengan alasan apa
          pun.
        </p>
        <p>
          Pastikan email yang didaftarkan aktif — seluruh invoice, konfirmasi
          pembayaran, nomor BIB, dan QR code tiket dikirim ke email tersebut.
          Cek juga folder Spam/Promotions bila email tidak kunjung masuk.
        </p>
        <p>
          Batas waktu pembayaran adalah{" "}
          <span className="font-bold">24 jam</span> sejak invoice diterbitkan.
          Jika melewati batas waktu, pendaftaran otomatis kedaluwarsa dan slot
          akan dibuka kembali untuk peserta lain.
        </p>
      </div>
    ),
  },
  {
    id: "pelaksanaan",
    icon: "🏁",
    accent: "bg-black text-white",
    title: "Pelaksanaan Lomba",
    content: (
      <div className="space-y-3">
        <p>
          Peserta wajib hadir di titik kumpul selambat-lambatnya{" "}
          <span className="font-bold">45 menit sebelum</span> jadwal
          keberangkatan untuk registrasi ulang dan pemanasan bersama.
        </p>
        <p>
          Rute acara akan ditandai dengan jelas dan dijaga oleh volunteer di
          setiap titik krusial. Ikuti arahan panitia dan petugas keamanan
          sepanjang jalur.
        </p>
        <p>
          Nomor BIB akan digunakan sebagai identitas utama peserta di garis
          akhir untuk validasi kehadiran, pengambilan konsumsi, dan proses
          penukaran e-sertifikat.
        </p>
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
