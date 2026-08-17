"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";
import { getRegistrationFee } from "@/libs/config/pricing";
import { spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";
import StatsCards from "@/components/dashboard/StatsCard";
import RegistrationsTable, {
  type Registration,
} from "@/components/dashboard/RegistrationTable";

// Baris registrations lengkap seperti yang dikirim event realtime Supabase
// (final_amount ikut dipakai buat hitung stat pendapatan).
type RealtimeRegistration = Registration & { final_amount: number };

// NIK itu data pribadi sensitif -- cuma dev@acs.id yang boleh lihat nilai
// aslinya. Update dari channel realtime bawa data mentah dari DB (ga lewat
// masking server), jadi wajib disamarkan lagi di sini juga.
const NIK_VISIBLE_EMAIL = "dev@acs.id";

function maskNik(
  row: RealtimeRegistration,
  viewerEmail: string,
): RealtimeRegistration {
  if (viewerEmail === NIK_VISIBLE_EMAIL || row.nik_terakhir === null) {
    return row;
  }
  return { ...row, nik_terakhir: row.nik_terakhir.slice(-10) };
}

// Status yang masih dianggap "peserta aktif" -- lagi nunggu bayar atau udah
// bayar dan terkonfirmasi. Dipisah dari status "gagal" (expired/cancelled)
// biar admin ga perlu scroll nyari peserta beneran di antara data basi.
const ACTIVE_STATUSES = new Set(["pending_payment", "confirmed"]);
// Status "gagal" -- kena expired otomatis (telat bayar 3 jam) atau
// dibatalkan manual oleh admin.
const INACTIVE_STATUSES = new Set(["expired", "cancelled"]);

const ACTIVE_STATUS_OPTIONS = [
  { value: "semua", label: "Semua status" },
  { value: "pending_payment", label: "Menunggu bayar" },
  { value: "confirmed", label: "Terkonfirmasi" },
];

const INACTIVE_STATUS_OPTIONS = [
  { value: "semua", label: "Semua status" },
  { value: "expired", label: "Kedaluwarsa" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function DashboardOverview({
  initialRegistrations,
  viewerEmail,
}: {
  initialRegistrations: RealtimeRegistration[];
  viewerEmail: string;
}) {
  const [rows, setRows] = useState(initialRegistrations);
  const [isLive, setIsLive] = useState(false);
  // Cuma 1 tabel yang ditampilin dalam satu waktu -- yang lain disembunyiin
  // pakai `hidden` (bukan di-unmount) biar search/filter/expanded row-nya
  // ga reset begitu admin pindah-pindah tab.
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

  // Satu-satunya channel realtime buat halaman ini. Stats card & kedua
  // tabel sama-sama diturunkan dari state `rows` yang sama, jadi ga ada
  // banyak subscription yang jalan bersamaan buat data yang sama.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("dashboard-overview-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (oldRow.id) {
              setRows((prev) => prev.filter((r) => r.id !== oldRow.id));
            }
            return;
          }

          const newRow = maskNik(
            payload.new as RealtimeRegistration,
            viewerEmail,
          );
          if (!newRow?.id) return;

          setRows((prev) => {
            const exists = prev.some((r) => r.id === newRow.id);
            if (exists) {
              return prev.map((r) => (r.id === newRow.id ? newRow : r));
            }
            // Pendaftar baru -> taruh paling atas, samain sama urutan
            // awal (created_at descending) dari server.
            return [newRow, ...prev];
          });
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewerEmail]);

  const stats = useMemo(() => {
    return {
      totalPeserta: rows.length,
      totalConfirmed: rows.filter((r) => r.status === "confirmed").length,
      totalPending: rows.filter((r) => r.status === "pending_payment").length,
      totalExpired: rows.filter((r) => r.status === "expired").length,
      totalCancelled: rows.filter((r) => r.status === "cancelled").length,
      totalRacePackTaken: rows.filter((r) => r.race_pack_taken_at).length,
      totalPelajar: rows.filter((r) => r.kategori === "pelajar").length,
      totalUmum: rows.filter((r) => r.kategori === "umum").length,
      totalPendapatan: rows
        .filter((r) => r.status === "confirmed")
        .reduce(
          (sum, r) => sum + (r.final_amount ?? getRegistrationFee(r.kategori)),
          0,
        ),
    };
  }, [rows]);

  // Dipisah di sini (bukan di dalam RegistrationsTable) supaya masing-masing
  // tabel murni cuma nerima subset data yang relevan buat dirinya.
  const activeRows = useMemo(
    () => rows.filter((r) => ACTIVE_STATUSES.has(r.status)),
    [rows],
  );
  const inactiveRows = useMemo(
    () => rows.filter((r) => INACTIVE_STATUSES.has(r.status)),
    [rows],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <StatsCards stats={stats} />

      {/* Tab switcher -- cuma 1 tabel yang keliatan, jadi total tinggi
          halaman ga numpuk dua tabel sekaligus. */}
      <div
        className={cn(
          spaceMono.className,
          "flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest",
        )}
      >
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={cn(
            "border-4 border-black px-4 py-2 transition-colors",
            activeTab === "active"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black/5",
          )}
        >
          Peserta Aktif ({activeRows.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inactive")}
          className={cn(
            "border-4 border-black px-4 py-2 transition-colors",
            activeTab === "inactive"
              ? "bg-[#D91E36] text-white"
              : "bg-white text-black hover:bg-black/5",
          )}
        >
          Kedaluwarsa & Dibatalkan ({inactiveRows.length})
        </button>
      </div>

      <div className={activeTab === "active" ? "" : "hidden"}>
        <RegistrationsTable
          registrations={activeRows}
          isLive={isLive}
          title="Peserta Aktif"
          statusOptions={ACTIVE_STATUS_OPTIONS}
          headerAccent="bg-[#FDF6E9]"
        />
      </div>

      <div className={activeTab === "inactive" ? "" : "hidden"}>
        <RegistrationsTable
          registrations={inactiveRows}
          isLive={isLive}
          title="Kedaluwarsa & Dibatalkan"
          statusOptions={INACTIVE_STATUS_OPTIONS}
          headerAccent="bg-[#FBEAEA]"
        />
      </div>
    </div>
  );
}
