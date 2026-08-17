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

type RealtimeRegistration = Registration & { final_amount: number };

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

const ACTIVE_STATUSES = new Set(["pending_payment", "confirmed"]);
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
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

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
