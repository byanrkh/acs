"use client";

import { useMemo, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { resendRegistrationEmail } from "@/libs/actions/admin";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Registration = {
  id: string;
  nama_lengkap: string;
  email: string;
  telepon: string;
  kategori: "pelajar" | "umum";
  ukuran_jersey: string;
  nama_bib: string;
  jenis_kelamin: "L" | "P";
  golongan_darah: string;
  status: string;
  bib_number: string | null;
  race_pack_taken_at: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Menunggu bayar",
  confirmed: "Terkonfirmasi",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "bg-[#FFD400]",
  confirmed: "bg-[#7ED957]",
  cancelled: "bg-[#D91E36] text-white",
  expired: "bg-black/20",
};

export default function RegistrationsTable({
  registrations,
}: {
  registrations: Registration[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [isPending, startTransition] = useTransition();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      const matchStatus = statusFilter === "semua" || r.status === statusFilter;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.nama_lengkap.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.bib_number ?? "").toLowerCase().includes(q) ||
        r.nama_bib.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [registrations, query, statusFilter]);

  function handleExport() {
    const rows = filtered.map((r) => ({
      "Nomor BIB": r.bib_number ?? "-",
      "Nama Lengkap": r.nama_lengkap,
      "Nama di BIB": r.nama_bib,
      Email: r.email,
      Telepon: r.telepon,
      Kategori: r.kategori,
      "Ukuran Jersey": r.ukuran_jersey,
      "Jenis Kelamin": r.jenis_kelamin,
      "Golongan Darah": r.golongan_darah,
      Status: STATUS_LABEL[r.status] ?? r.status,
      "Race Pack Diambil": r.race_pack_taken_at ? "Sudah" : "Belum",
      "Tanggal Daftar": r.created_at
        ? new Intl.DateTimeFormat("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Jakarta",
          }).format(new Date(r.created_at))
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Peserta");
    XLSX.writeFile(workbook, `peserta-acs-2026-${Date.now()}.xlsx`);
  }

  function handleResend(id: string) {
    setResendingId(id);
    startTransition(async () => {
      const res = await resendRegistrationEmail(id);
      setFeedback((prev) => ({
        ...prev,
        [id]: res.ok ? "Email terkirim ✓" : res.error,
      }));
      setResendingId(null);
      setTimeout(() => {
        setFeedback((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 4000);
    });
  }

  const canResend = (status: string) =>
    status === "confirmed" || status === "pending_payment";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className={cn(
            SpecialGhotic.className,
            "text-xl uppercase tracking-tight sm:text-2xl",
          )}
        >
          Data Peserta ({filtered.length})
        </h1>
        <button
          type="button"
          onClick={handleExport}
          className="border-4 border-black bg-[#FFD400] px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          Export ke Excel
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Cari nama, email, atau nomor BIB..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-4 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-[#FFF7DA]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            spaceMono.className,
            "border-4 border-black bg-white px-3 py-2 text-xs uppercase",
          )}
        >
          <option value="semua">Semua status</option>
          <option value="pending_payment">Menunggu bayar</option>
          <option value="confirmed">Terkonfirmasi</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="expired">Kedaluwarsa</option>
        </select>
      </div>

      {/* Tabel — desktop */}
      <div className="mt-6 hidden overflow-x-auto border-4 border-black bg-white sm:block">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr
              className={cn(
                spaceMono.className,
                "border-b-4 border-black bg-black text-[10px] uppercase tracking-widest text-white",
              )}
            >
              <th className="px-3 py-3">BIB</th>
              <th className="px-3 py-3">Nama</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Telepon</th>
              <th className="px-3 py-3">Kategori</th>
              <th className="px-3 py-3">Jersey</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Race Pack</th>
              <th className="px-3 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b-2 border-black/10 last:border-b-0 even:bg-black/[0.02]"
              >
                <td className="px-3 py-3 font-bold">{r.bib_number ?? "-"}</td>
                <td className="px-3 py-3">{r.nama_lengkap}</td>
                <td className="px-3 py-3 text-black/70">{r.email}</td>
                <td className="px-3 py-3 text-black/70">{r.telepon}</td>
                <td className="px-3 py-3 capitalize">{r.kategori}</td>
                <td className="px-3 py-3">{r.ukuran_jersey}</td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-block border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase",
                      STATUS_COLOR[r.status],
                    )}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {r.race_pack_taken_at ? "✅ Sudah" : "—"}
                </td>
                <td className="px-3 py-3">
                  {canResend(r.status) ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => handleResend(r.id)}
                        disabled={isPending && resendingId === r.id}
                        className="border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50"
                      >
                        {resendingId === r.id ? "Mengirim..." : "Kirim ulang"}
                      </button>
                      {feedback[r.id] && (
                        <p className="mt-1 text-[10px] font-bold text-[#1F4B33]">
                          {feedback[r.id]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-black/30">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-black/40">
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card — mobile */}
      <div className="mt-6 space-y-3 sm:hidden">
        {filtered.map((r) => (
          <div key={r.id} className="border-4 border-black bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={cn(
                    spaceMono.className,
                    "text-[9px] uppercase tracking-widest text-black/40",
                  )}
                >
                  BIB
                </p>
                <p className={cn(SpecialGhotic.className, "text-xl")}>
                  {r.bib_number ?? "-"}
                </p>
              </div>
              <span
                className={cn(
                  "border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase",
                  STATUS_COLOR[r.status],
                )}
              >
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            </div>

            <p className="mt-2 font-bold">{r.nama_lengkap}</p>
            <p className="text-xs text-black/60">{r.email}</p>

            <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
              <div>
                <span className="text-black/40">Telp: </span>
                {r.telepon}
              </div>
              <div className="capitalize">
                <span className="text-black/40">Kategori: </span>
                {r.kategori}
              </div>
              <div>
                <span className="text-black/40">Jersey: </span>
                {r.ukuran_jersey}
              </div>
              <div>
                <span className="text-black/40">Race Pack: </span>
                {r.race_pack_taken_at ? "✅" : "—"}
              </div>
            </div>

            {canResend(r.status) && (
              <button
                type="button"
                onClick={() => handleResend(r.id)}
                disabled={isPending && resendingId === r.id}
                className="mt-3 w-full border-2 border-black bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50"
              >
                {resendingId === r.id ? "Mengirim..." : "Kirim ulang email"}
              </button>
            )}
            {feedback[r.id] && (
              <p className="mt-2 text-[11px] font-bold text-[#1F4B33]">
                {feedback[r.id]}
              </p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="border-4 border-black bg-white p-6 text-center text-sm text-black/40">
            Tidak ada data yang cocok.
          </p>
        )}
      </div>
    </div>
  );
}
