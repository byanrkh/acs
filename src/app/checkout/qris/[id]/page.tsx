import { notFound } from "next/navigation";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { supabaseAdmin } from "@/libs/supabase/server";
import { getRegistrationFee } from "@/libs/config/pricing";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function QrisCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select("id, nama_lengkap, kategori, status, nomor_urut, bukti_transfer")
    .eq("id", id)
    .single();

  if (!registration) {
    notFound();
  }

  const grossAmount =
    getRegistrationFee(registration.kategori) + (registration.nomor_urut ?? 0);

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-lg">
          <span className="inline-block -rotate-2 border-4 border-black bg-[#FFD400] px-4 py-1.5 text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Checkout QRIS
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
                : "Scan & bayar"}
          </h1>

          <div className="mt-8 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-8">
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

            {registration.status !== "confirmed" &&
              registration.status !== "waiting_verification" && (
                <>
                  <p className="text-center text-sm text-black/70">
                    Scan QRIS di bawah ini pakai e-wallet atau m-banking kamu.
                  </p>

                  <div className="mx-auto mt-4 w-full max-w-xs border-4 border-black bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={process.env.NEXT_PUBLIC_QRIS_IMAGE_URL ?? ""}
                      alt="QRIS Statis ACS 2026"
                      className="h-auto w-full"
                    />
                  </div>

                  <div className="mt-6 border-4 border-black bg-[#FFD400] p-4 text-center">
                    <p className="text-xs uppercase tracking-widest text-black/70">
                      Transfer TEPAT sejumlah (wajib pakai kode unik)
                    </p>
                    <p
                      className={cn(
                        SpecialGhotic.className,
                        "mt-1 text-3xl text-black",
                      )}
                    >
                      {formatRupiah(grossAmount)}
                    </p>
                    <p
                      className={cn(
                        spaceMono.className,
                        "mt-2 text-xs text-black/70",
                      )}
                    >
                      Kode unik: {registration.nomor_urut ?? 0}
                    </p>
                  </div>

                  <p className="mt-4 text-center text-xs text-black/60">
                    Nominal harus sama persis. Kode unik dipakai buat
                    mencocokkan pembayaranmu secara otomatis, jadi jangan
                    dibulatkan.
                  </p>

                  <Button
                    href={`/checkout/qris/${registration.id}/upload`}
                    variant="primary"
                    className="mt-6 w-full justify-center text-[#004D3D]"
                  >
                    Saya Sudah Bayar
                  </Button>
                </>
              )}
          </div>
        </div>
      </Container>
    </section>
  );
}
