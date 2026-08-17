import { supabaseAdmin } from "@/libs/supabase/server";
import VerifikasiTransferTable from "@/components/dashboard/VerifikasiTransferTable";
import BuktiTransferHistory from "@/components/dashboard/BuktiTransferHistory";

export const dynamic = "force-dynamic";
const HISTORY_LIMIT = 2000;

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

  const data = (registrations ?? []).map((r) => ({
    ...r,
    grossAmount: r.final_amount + (r.nomor_urut ?? 0),
  }));
  const { data: historyRows, error: historyError } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, nama_lengkap, kategori, ukuran_jersey, nomor_urut, bukti_transfer, created_at, final_amount, status",
    )
    .not("bukti_transfer", "is", null)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const historyData = (historyRows ?? []).map((r) => ({
    ...r,
    grossAmount: r.final_amount + (r.nomor_urut ?? 0),
  }));

  return (
    <div className="flex flex-col gap-10">
      <VerifikasiTransferTable registrations={data} />

      <div>
        {historyError ? (
          <p className="border-4 border-[#D91E36] bg-[#D91E36]/10 p-4 text-sm font-bold text-[#D91E36]">
            Gagal memuat riwayat bukti transfer: {historyError.message}
          </p>
        ) : (
          <BuktiTransferHistory items={historyData} />
        )}
      </div>
    </div>
  );
}
