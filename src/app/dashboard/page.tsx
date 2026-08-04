import { supabaseAdmin } from "@/libs/supabase/server";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import PageHeader from "@/components/dashboard/PageHeader";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: registrations, error } = await supabaseAdmin
    .from("registrations")
    .select(
      "id, nama_lengkap, email, telepon, kategori, ukuran_jersey, nama_bib, jenis_kelamin, golongan_darah, status, bib_number, race_pack_taken_at, created_at, final_amount, nisn, nik_terakhir",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="border-4 border-[#D91E36] bg-[#D91E36]/10 p-4 text-sm font-bold text-[#D91E36]">
        Gagal memuat data peserta: {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader eyebrow="Overview" title="Data Peserta" />
      <DashboardOverview initialRegistrations={registrations ?? []} />
    </div>
  );
}
