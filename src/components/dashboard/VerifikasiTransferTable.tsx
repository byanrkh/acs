"use client";

import { useState, useTransition } from "react";
import { approveTransferPayment } from "@/libs/actions/transferAdmin";
import { spaceMono } from "@/libs/Font";
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
  const [isPending, startTransition] = useTransition();

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

  if (rows.length === 0) {
    return (
      <div className="border-4 border-black bg-white p-6 text-center text-sm text-black/60 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        Tidak ada pembayaran transfer yang menunggu verifikasi.
      </div>
    );
  }

  return (
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
                <button
                  type="button"
                  onClick={() => handleApprove(r.id)}
                  disabled={isPending && pendingId === r.id}
                  className="border-4 border-black bg-[#1F4B33] px-3 py-2 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                >
                  {isPending && pendingId === r.id ? "Memproses..." : "Approve"}
                </button>
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
  );
}
