import { supabaseAdmin } from "@/libs/supabase/server";
import { getRegistrationFee } from "@/libs/config/pricing";
import VerifikasiQrisTable from "@/components/dashboard/VerifikasiQrisTable";

export const dynamic = "force-dynamic";

export default async function VerifikasiQrisPage() {
  const { data: registrations, error } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, nama_lengkap, kategori, ukuran_jersey, nomor_urut, bukti_transfer, created_at",
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

  const data = (registrations ?? []).map((r) => ({
    ...r,
    grossAmount: getRegistrationFee(r.kategori) + (r.nomor_urut ?? 0),
  }));

  return <VerifikasiQrisTable registrations={data} />;
}
