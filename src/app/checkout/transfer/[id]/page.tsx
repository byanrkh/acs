import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { supabaseAdmin } from "@/libs/supabase/server";
import TransferCheckoutClient from "@/components/checkout/TransferCheckoutClient";

export default async function TransferCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: registration } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, nama_lengkap, email, telepon, nisn, nik_terakhir, tempat_lahir, tanggal_lahir, jenis_kelamin, golongan_darah, riwayat_penyakit, kontak_darurat_nama, kontak_darurat_telepon, nama_bib, kategori, ukuran_jersey, status, nomor_urut, bukti_transfer, discount_amount, final_amount, promos:promo_id ( code )",
    )
    .eq("id", id)
    .single();

  if (!registration) {
    notFound();
  }

  const promoRelation = registration.promos as unknown;
  const promo = (
    Array.isArray(promoRelation) ? promoRelation[0] : promoRelation
  ) as { code: string } | null;

  return (
    <section className="py-16 md:py-24">
      <Container>
        <TransferCheckoutClient
          registration={{
            id: registration.id,
            nama_lengkap: registration.nama_lengkap,
            email: registration.email,
            telepon: registration.telepon,
            nisn: registration.nisn,
            nik_terakhir: registration.nik_terakhir,
            tempat_lahir: registration.tempat_lahir,
            tanggal_lahir: registration.tanggal_lahir,
            jenis_kelamin: registration.jenis_kelamin,
            golongan_darah: registration.golongan_darah,
            riwayat_penyakit: registration.riwayat_penyakit,
            kontak_darurat_nama: registration.kontak_darurat_nama,
            kontak_darurat_telepon: registration.kontak_darurat_telepon,
            nama_bib: registration.nama_bib,
            kategori: registration.kategori,
            ukuran_jersey: registration.ukuran_jersey,
            status: registration.status,
            nomor_urut: registration.nomor_urut,
            bukti_transfer: registration.bukti_transfer,
            discount_amount: registration.discount_amount,
            final_amount: registration.final_amount,
            promo_code: promo?.code ?? null,
          }}
        />
      </Container>
    </section>
  );
}
