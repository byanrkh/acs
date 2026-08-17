import Container from "@/components/Container";
import PageHero from "@/components/PageHero";
import CtaBanner from "@/components/CtaBanner";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import { CONTACT_INFO, whatsappHref } from "@/libs/config/contact";
import {
  FaEnvelope,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Button from "@/components/Button";

const hasWhatsapp =
  CONTACT_INFO.whatsapp !== "-" && CONTACT_INFO.whatsapp.length > 0;

const contactCards = [
  {
    label: "Email",
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
    icon: FaEnvelope,
    color: "bg-[#FFD400]",
  },
  ...(hasWhatsapp
    ? [
        {
          label: "WhatsApp",
          value: CONTACT_INFO.whatsapp,
          href: whatsappHref(CONTACT_INFO.whatsapp),
          icon: FaWhatsapp,
          color: "bg-[#7ED957]",
        },
      ]
    : []),
  {
    label: "Instagram",
    value: CONTACT_INFO.instagram,
    href: CONTACT_INFO.instagramUrl,
    icon: FaInstagram,
    color: "bg-[#5AC8FA]",
  },
];

export default function ContactPage() {
  return (
    <div className="overflow-hidden">
      <PageHero title="Contact" subtitle="Ada pertanyaan? Hubungi kami" />

      <Container>
        <section className="relative -mt-8 sm:-mt-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {contactCards.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    c.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="group flex flex-col items-center gap-3 border-4 border-black bg-white p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border-4 border-black text-2xl text-black",
                      c.color,
                    )}
                  >
                    <Icon />
                  </span>
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-[11px] uppercase tracking-widest text-black/50",
                    )}
                  >
                    {c.label}
                  </p>
                  <p className="break-all text-sm font-bold text-black group-hover:text-[#FF5A1F]">
                    {c.value}{" "}
                    {c.value === "+62 856-9770-3733" ? "(Gading)" : null}
                  </p>
                </a>
              );
            })}
          </div>
        </section>
        <section className="mt-16 sm:mt-24">
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-10">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-black bg-[#FFD400] text-2xl text-black"
                >
                  <FaMapMarkerAlt />
                </span>
                <div>
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-[11px] uppercase tracking-widest text-black/50",
                    )}
                  >
                    Lokasi Acara
                  </p>
                  <h2
                    className={cn(
                      SpecialGhotic.className,
                      "mt-1 text-xl uppercase tracking-tight text-black sm:text-2xl",
                    )}
                  >
                    {CONTACT_INFO.address}
                  </h2>
                </div>
              </div>

              <Button
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`}
                external
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                Buka Maps ↗
              </Button>
            </div>
          </div>
        </section>
        <section className="mt-16 sm:mt-24">
          <div className="mb-8 sm:mb-10">
            <span
              className={cn(
                spaceMono.className,
                "text-xs uppercase tracking-widest text-[#FF5A1F]",
              )}
            >
              Sering ditanyakan
            </span>
            <h2
              className={cn(
                SpecialGhotic.className,
                "mt-2 text-3xl uppercase tracking-tight sm:text-4xl",
              )}
            >
              FAQ
            </h2>
          </div>

          <div className="space-y-4">
            <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-base uppercase tracking-tight text-black sm:text-lg",
                )}
              >
                📝 Registrasi &amp; Pendaftaran
              </p>
              <ul className="ml-5 mt-2 list-disc text-sm leading-relaxed text-black/70">
                <li>
                  <b>Cara Daftar</b>: Isi formulir di website resmi, pilih
                  kategori (Pelajar/Umum), dan selesaikan pembayaran.
                </li>
                <li>
                  <b>Ubah Data</b>: Data yang sudah dikirim dan dibayar tidak
                  dapat diubah (termasuk ukuran jersey).
                </li>
                <li>
                  <b>Pengalihan Tiket</b>: Nomor BIB / tiket bersifat personal
                  dan tidak dapat dipindahtangankan atau diperjualbelikan.
                </li>
              </ul>
            </div>
            <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-base uppercase tracking-tight text-black sm:text-lg",
                )}
              >
                💸 Pembatalan &amp; Refund
              </p>
              <ul className="ml-5 mt-2 list-disc text-sm leading-relaxed text-black/70">
                <li>
                  <b>Kebijakan Refund</b>: Biaya pendaftaran bersifat Final
                  &amp; Non-Refundable (tidak bisa dikembalikan) dengan alasan
                  apa pun dari pihak peserta.
                </li>
                <li>
                  <b>Pembatalan Acara</b>: Jika ada pergeseran/pembatalan jadwal
                  dari panitia karena force majeure, informasi pengembalian dana
                  atau jadwal baru akan diumumkan via email resmi.
                </li>
              </ul>
            </div>
            <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-base uppercase tracking-tight text-black sm:text-lg",
                )}
              >
                🎽 Pengambilan Racepack (RPC)
              </p>
              <ul className="ml-5 mt-2 list-disc text-sm leading-relaxed text-black/70">
                <li>
                  <b>Jadwal &amp; Lokasi</b>: 21-22 Agustus 2026, Lapangan
                  Indoor SMAI Al Azhar 4
                </li>
                <li>
                  <b>Syarat Pengambilan</b>: Membawa Email Konfirmasi
                  Pendaftaran dan Kartu Identitas Asli (KTP/SIM/Kartu Pelajar).
                </li>
              </ul>
            </div>
            <div className="border-4 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-base uppercase tracking-tight text-black sm:text-lg",
                )}
              >
                🎒 Penitipan Barang (Drop Baggage)
              </p>
              <ul className="ml-5 list-disc">
                <li>Informasi Menyusul</li>
              </ul>
            </div>
          </div>
        </section>

        <CtaBanner
          heading="Masih ada yang mau"
          headingBreak="ditanyain?"
          description="Langsung aja DM Instagram atau email kami, panitia siap bantu."
          primary={{
            href: `mailto:${CONTACT_INFO.email}`,
            label: "Email Kami",
          }}
          secondary={{
            href: CONTACT_INFO.instagramUrl,
            label: "Instagram ↗",
            external: true,
          }}
        />
      </Container>
    </div>
  );
}
