import { supabaseAdmin } from "@/libs/supabase/server";
import VerifikasiTransferTable from "@/components/dashboard/VerifikasiTransferTable";

export const dynamic = "force-dynamic";

export default async function VerifikasiTransferPage() {
  const { data: registrations, error } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, nama_lengkap, kategori, ukuran_jersey, nomor_urut, bukti_transfer, created_at, final_amount",
    )
    .eq("status", "waiting_verification")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="border-4 border-[#D91E36] bg-[#D91E36]/10 p-4 text-sm font-bold text-[#D91E36]">
        Gagal memuat data: {error.message}
      </p>
    );
  }

  // PROMO: grossAmount sekarang pakai final_amount (sudah memperhitungkan
  // diskon promo kalau ada) + kode unik, BUKAN tarif dasar kategori mentah.
  const data = (registrations ?? []).map((r) => ({
    ...r,
    grossAmount: r.final_amount + (r.nomor_urut ?? 0),
  }));

  return <VerifikasiTransferTable registrations={data} />;
}
