"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";
import { getRegistrationFee } from "@/libs/config/pricing";
import StatsCards from "@/components/dashboard/StatsCard";
import RegistrationsTable, {
  type Registration,
} from "@/components/dashboard/RegistrationTable";

// Baris registrations lengkap seperti yang dikirim event realtime Supabase
// (final_amount ikut dipakai buat hitung stat pendapatan).
type RealtimeRegistration = Registration & { final_amount: number };

export default function DashboardOverview({
  initialRegistrations,
}: {
  initialRegistrations: RealtimeRegistration[];
}) {
  const [rows, setRows] = useState(initialRegistrations);
  const [isLive, setIsLive] = useState(false);

  // Satu-satunya channel realtime buat halaman ini. Stats card & tabel
  // sama-sama diturunkan dari state `rows` yang sama, jadi ga ada dua
  // subscription yang jalan bersamaan buat data yang sama.
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

          const newRow = payload.new as RealtimeRegistration;
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
  }, []);

  const stats = useMemo(() => {
    return {
      totalPeserta: rows.length,
      totalConfirmed: rows.filter((r) => r.status === "confirmed").length,
      totalPending: rows.filter((r) => r.status === "pending_payment").length,
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <StatsCards stats={stats} />
      <RegistrationsTable registrations={rows} isLive={isLive} />
    </div>
  );
}
