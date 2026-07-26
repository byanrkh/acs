"use client";

import { useEffect, useState, useTransition } from "react";
import { approveTransferPayment } from "@/libs/actions/transferAdmin";
import { createSupabaseBrowserClient } from "@/libs/supabase/client";
import { getRegistrationFee } from "@/libs/config/pricing";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Row = {
  id: string;
  nama_lengkap: string;
  kategori: "pelajar" | "umum";
  ukuran_jersey: string;
  nomor_urut: number | null;
  bukti_transfer: string | null;
  created_at: string;
  grossAmount: number;
};

// Bentuk row registrations langsung dari event realtime Supabase —
// kolomnya lebih lengkap dari yang kepake di tabel ini.
type RealtimeRegistration = {
  id: string;
  status: string;
  nama_lengkap: string;
  kategori: "pelajar" | "umum";
  ukuran_jersey: string;
  nomor_urut: number | null;
  bukti_transfer: string | null;
  created_at: string;
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function VerifikasiTransferTable({
  registrations,
}: {
  registrations: Row[];
}) {
  const [rows, setRows] = useState(registrations);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorRow, setErrorRow] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Live update: dengerin perubahan tabel registrations langsung dari
  // Supabase Realtime, jadi begitu ada peserta upload bukti baru, atau
  // admin lain approve, tabel ini ke-update otomatis tanpa reload.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("verifikasi-transfer-realtime")
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

          if (newRow.status !== "waiting_verification") {
            // Statusnya udah bukan "menunggu verifikasi" lagi (di-approve /
            // dibatalkan) -> keluarkan dari antrian kalau masih ada.
            setRows((prev) => prev.filter((r) => r.id !== newRow.id));
            return;
          }

          // status === "waiting_verification" -> masuk/refresh di antrian.
          const updatedRow: Row = {
            id: newRow.id,
            nama_lengkap: newRow.nama_lengkap,
            kategori: newRow.kategori,
            ukuran_jersey: newRow.ukuran_jersey,
            nomor_urut: newRow.nomor_urut,
            bukti_transfer: newRow.bukti_transfer,
            created_at: newRow.created_at,
            grossAmount:
              getRegistrationFee(newRow.kategori) + (newRow.nomor_urut ?? 0),
          };

          setRows((prev) => {
            const exists = prev.some((r) => r.id === updatedRow.id);
            if (exists) {
              return prev.map((r) => (r.id === updatedRow.id ? updatedRow : r));
            }
            return [...prev, updatedRow];
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

  function handleApprove(id: string) {
    setErrorRow(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await approveTransferPayment(id);
      setPendingId(null);
      if (!result.ok) {
        setErrorRow({ id, message: result.error });
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className={cn(
            SpecialGhotic.className,
            "text-xl uppercase tracking-tight sm:text-2xl",
          )}
        >
          Verifikasi Transfer ({rows.length})
        </h1>
        <span
          className={cn(
            spaceMono.className,
            "flex shrink-0 items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isLive ? "bg-emerald-500 animate-pulse" : "bg-black/40",
            )}
          />
          {isLive ? null : "Connecting..."}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="border-4 border-black bg-white p-6 text-center text-sm text-black/60 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Tidak ada pembayaran transfer yang menunggu verifikasi.
        </div>
      ) : (
        <div className="overflow-x-auto border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <table
            className={cn(spaceMono.className, "w-full min-w-[720px] text-xs")}
          >
            <thead>
              <tr className="border-b-4 border-black bg-[#FFD400] text-left uppercase">
                <th className="px-3 py-3">Nama</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3">Nominal + Kode Unik</th>
                <th className="px-3 py-3">Bukti transfer</th>
                <th className="px-3 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b-2 border-black/10 align-top">
                  <td className="px-3 py-3 font-bold">{r.nama_lengkap}</td>
                  <td className="px-3 py-3 capitalize">{r.kategori}</td>
                  <td className="px-3 py-3">
                    {formatRupiah(r.grossAmount)}
                    <br />
                    <span className="text-black/50">
                      Kode unik: {r.nomor_urut ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {r.bukti_transfer ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.bukti_transfer}
                        alt={`Bukti transfer ${r.nama_lengkap}`}
                        className="h-24 w-auto border-2 border-black object-cover"
                      />
                    ) : (
                      <span className="text-black/40">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleApprove(r.id)}
                        disabled={isPending && pendingId === r.id}
                        className="border-4 border-black bg-[#1F4B33] px-3 py-2 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                      >
                        {isPending && pendingId === r.id
                          ? "Memproses..."
                          : "Approve"}
                      </button>
                    </div>
                    {errorRow?.id === r.id && (
                      <p className="mt-2 text-[11px] text-[#D91E36]">
                        {errorRow.message}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
