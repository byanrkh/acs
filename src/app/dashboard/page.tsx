import { supabaseAdmin } from "@/libs/supabase/server";
import { getRegistrationFee } from "@/libs/config/pricing";
import StatsCards from "@/components/dashboard/StatsCard";
import RegistrationsTable from "@/components/dashboard/RegistrationTable";
import LogsPanel from "@/components/dashboard/LogsPanel";
import PromoManagementCard from "@/components/dashboard/PromoManagementCard";
import { getAuditLogs, getPaymentLogs } from "@/libs/actions/logs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ data: registrations, error }, auditLogs, paymentLogs] =
    await Promise.all([
      supabaseAdmin
        .from("registrations")
        .select(
          "id, nama_lengkap, email, telepon, kategori, ukuran_jersey, nama_bib, jenis_kelamin, golongan_darah, status, bib_number, race_pack_taken_at, created_at, final_amount",
        )
        .order("created_at", { ascending: false }),
      getAuditLogs(),
      getPaymentLogs(),
    ]);

  if (error) {
    return (
      <p className="border-4 border-[#D91E36] bg-[#D91E36]/10 p-4 text-sm font-bold text-[#D91E36]">
        Gagal memuat data peserta: {error.message}
      </p>
    );
  }

  const data = registrations ?? [];

  const stats = {
    totalPeserta: data.length,
    totalConfirmed: data.filter((r) => r.status === "confirmed").length,
    totalPending: data.filter((r) => r.status === "pending_payment").length,
    totalRacePackTaken: data.filter((r) => r.race_pack_taken_at).length,
    totalPelajar: data.filter((r) => r.kategori === "pelajar").length,
    totalUmum: data.filter((r) => r.kategori === "umum").length,
    // PROMO: pakai final_amount (nominal yang BENAR-BENAR dibayar, sudah
    // memperhitungkan diskon promo kalau ada) alih-alih getRegistrationFee
    // mentah, supaya "Total Pendapatan" tetap akurat begitu promo dipakai.
    // Fallback ke getRegistrationFee cuma buat jaga-jaga row lama yang
    // entah kenapa belum ke-backfill saat migrasi.
    totalPendapatan: data
      .filter((r) => r.status === "confirmed")
      .reduce(
        (sum, r) => sum + (r.final_amount ?? getRegistrationFee(r.kategori)),
        0,
      ),
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <StatsCards stats={stats} />
      <RegistrationsTable registrations={data} />
      <LogsPanel auditLogs={auditLogs} paymentLogs={paymentLogs} />
      <PromoManagementCard />
    </div>
  );
}
