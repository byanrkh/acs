"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { resendRegistrationEmail } from "@/libs/actions/admin";
import DeleteRegistrationModal from "@/components/dashboard/DeleteRegistrationModal";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

export type Registration = {
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
  nisn: string | null;
  nik_terakhir: string | null;
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

function formatDateTime(iso: string | null) {
  return iso
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(iso))
    : "-";
}

// Salin teks singkat ke clipboard, dipakai buat ID / email / telepon di panel detail.
function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // no-op — kalau ini gagal juga, biarin user salin manual.
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Salin"
      className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center align-middle text-black/30 transition-colors hover:text-black"
    >
      {copied ? (
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
          <path
            d="M2.5 8.5l3 3 8-8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M3.5 10.5h-1a1 1 0 01-1-1v-7a1 1 0 011-1h7a1 1 0 011 1v1"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      )}
    </button>
  );
}

// Satu baris label/value di dalam panel detail — dipakai berulang di tiap seksi.
function DetailField({
  label,
  children,
  copyValue,
}: {
  label: string;
  children: React.ReactNode;
  copyValue?: string;
}) {
  return (
    <div>
      <p
        className={cn(
          spaceMono.className,
          "text-[9px] uppercase tracking-widest text-black/40",
        )}
      >
        {label}
      </p>
      <p className="mt-0.5 flex items-center break-words text-sm font-bold">
        {children}
        {copyValue && <CopyChip value={copyValue} />}
      </p>
    </div>
  );
}

function DetailSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-black bg-white">
      <div
        className={cn(
          "flex items-center gap-2 border-b-2 border-black px-3 py-1.5",
          accent,
        )}
      >
        <h3
          className={cn(
            SpecialGhotic.className,
            "text-[11px] uppercase tracking-tight",
          )}
        >
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 sm:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

// Panel detail lengkap — semua kolom data ditampilkan, dikelompokkan biar gampang
// dibaca, gayanya kaya kartu boarding pass / audit trail, bukan cuma daftar rata.
function DetailPanel({ r }: { r: Registration }) {
  return (
    <div className="space-y-3 border-t-4 border-black bg-[#FFF7DA] p-4">
      <DetailSection title="Identitas" accent="bg-[#FFD400]">
        <DetailField label="ID Registrasi" copyValue={r.id}>
          <span className="truncate font-normal text-black/60">{r.id}</span>
        </DetailField>
        <DetailField label="Nama Lengkap">{r.nama_lengkap}</DetailField>
        <DetailField label="Nama di BIB">{r.nama_bib}</DetailField>
        <DetailField label="Jenis Kelamin">
          {r.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
        </DetailField>
        <DetailField label="Golongan Darah">
          {r.golongan_darah || "-"}
        </DetailField>
        <DetailField label="Kategori">
          <span className="capitalize">{r.kategori}</span>
        </DetailField>
        <DetailField label="Nik/Nisn">
          <span className="capitalize">
            {r.kategori === "pelajar" ? r.nisn : r.nik_terakhir}
          </span>
        </DetailField>
      </DetailSection>

      <DetailSection title="Kontak" accent="bg-[#7ED957]">
        <DetailField label="Email" copyValue={r.email}>
          <span className="truncate">{r.email}</span>
        </DetailField>
        <DetailField label="Telepon" copyValue={r.telepon}>
          {r.telepon}
        </DetailField>
      </DetailSection>

      <DetailSection
        title="Event & BIB"
        accent="bg-[#3B82F6] [&_h3]:text-white"
      >
        <DetailField label="Nomor BIB">
          {r.bib_number ?? <span className="text-black/30">Belum ada</span>}
        </DetailField>
        <DetailField label="Ukuran Jersey">{r.ukuran_jersey}</DetailField>
        <DetailField label="Status">
          <span
            className={cn(
              "inline-block border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase",
              STATUS_COLOR[r.status],
            )}
          >
            {STATUS_LABEL[r.status] ?? r.status}
          </span>
        </DetailField>
      </DetailSection>

      <DetailSection title="Waktu & Race Pack" accent="bg-[#A78BFA]">
        <DetailField label="Tanggal Daftar">
          {formatDateTime(r.created_at)}
        </DetailField>
        <DetailField label="Race Pack Diambil">
          {r.race_pack_taken_at ? "✅ Sudah" : "— Belum"}
        </DetailField>
        <DetailField label="Waktu Pengambilan">
          {r.race_pack_taken_at ? formatDateTime(r.race_pack_taken_at) : "-"}
        </DetailField>
      </DetailSection>
    </div>
  );
}

export default function RegistrationsTable({
  registrations,
  isLive,
}: {
  registrations: Registration[];
  isLive: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [isPending, startTransition] = useTransition();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Target peserta yang mau dihapus — begitu di-set, modal konfirmasi muncul.
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  // Dihapus optimis di sisi client biar hilang instan dari tabel walau
  // realtime subscription di parent belum sempat propagate event DELETE-nya.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (deletedIds.has(r.id)) return false;
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
  }, [registrations, query, statusFilter, deletedIds]);

  function handleExport() {
    // Semua kolom dijabarin lengkap, bukan cuma ringkasan yang tampil di UI.
    const rows = filtered.map((r) => ({
      "ID Registrasi": r.id,
      "Nomor BIB": r.bib_number ?? "-",
      "Nama Lengkap": r.nama_lengkap,
      "Nama di BIB": r.nama_bib,
      Email: r.email,
      Telepon: r.telepon,
      Kategori: r.kategori,
      "Ukuran Jersey": r.ukuran_jersey,
      "Jenis Kelamin": r.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan",
      "Golongan Darah": r.golongan_darah,
      Status: STATUS_LABEL[r.status] ?? r.status,
      "Race Pack Diambil": r.race_pack_taken_at ? "Sudah" : "Belum",
      "Waktu Pengambilan Race Pack": formatDateTime(r.race_pack_taken_at),
      "Tanggal Daftar": formatDateTime(r.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Lebar kolom biar enak dibaca, ga mepet-mepet.
    worksheet["!cols"] = [
      { wch: 38 }, // ID Registrasi
      { wch: 10 }, // Nomor BIB
      { wch: 24 }, // Nama Lengkap
      { wch: 20 }, // Nama di BIB
      { wch: 28 }, // Email
      { wch: 16 }, // Telepon
      { wch: 10 }, // Kategori
      { wch: 12 }, // Ukuran Jersey
      { wch: 12 }, // Jenis Kelamin
      { wch: 14 }, // Golongan Darah
      { wch: 16 }, // Status
      { wch: 16 }, // Race Pack Diambil
      { wch: 24 }, // Waktu Pengambilan Race Pack
      { wch: 20 }, // Tanggal Daftar
    ];

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

  function handleDeleted(id: string) {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setExpandedId((prev) => (prev === id ? null : prev));
  }

  const canResend = (status: string) =>
    status === "confirmed" || status === "pending_payment";

  // Label tombol beda tergantung status: peserta yang belum bayar dapet
  // "reminder", yang udah confirmed dapet "kirim ulang tiket" (isinya QR).
  const resendLabel = (status: string) =>
    status === "confirmed" ? "Resend E-Tiket" : "Remind";

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-col gap-4 border-b-4 border-black bg-[#FDF6E9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1
          className={cn(
            SpecialGhotic.className,
            "text-lg uppercase tracking-tight sm:text-xl",
          )}
        >
          Data Peserta ({filtered.length})
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              spaceMono.className,
              "flex shrink-0 items-center gap-2 border-2 border-black bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isLive ? "animate-pulse bg-emerald-500" : "bg-black/40",
              )}
            />
            {isLive ? "Live" : "Connecting..."}
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="border-4 border-black bg-[#FFD400] px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            Export ke Excel
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:px-6">
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

      {/* Tabel — desktop. Klik baris buat buka panel detail lengkap ala audit log. */}
      <div className="hidden overflow-x-auto border-t-4 border-black sm:block">
        <table className="w-full min-w-[1150px] text-left text-sm">
          <thead>
            <tr
              className={cn(
                spaceMono.className,
                "border-b-4 border-black bg-black text-[10px] uppercase tracking-widest text-white",
              )}
            >
              <th className="w-8 px-3 py-3" />
              <th className="px-3 py-3">BIB</th>
              <th className="px-3 py-3">Nama</th>
              <th className="px-3 py-3">Nama di BIB</th>
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
            {filtered.map((r) => {
              const isOpen = expandedId === r.id;
              return (
                <Fragment key={r.id}>
                  <tr
                    key={r.id}
                    onClick={() => toggleExpanded(r.id)}
                    className={cn(
                      "cursor-pointer border-b-2 border-black/10 transition-colors last:border-b-0",
                      isOpen
                        ? "bg-[#FFF7DA]"
                        : "even:bg-black/[0.02] hover:bg-black/[0.04]",
                    )}
                  >
                    <td className="px-3 py-3 text-black/30">
                      {isOpen ? "▾" : "▸"}
                    </td>
                    <td className="px-3 py-3 font-bold">
                      {r.bib_number ?? "-"}
                    </td>
                    <td className="px-3 py-3">{r.nama_lengkap}</td>
                    <td className="px-3 py-3 text-black/70">{r.nama_bib}</td>
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
                    <td
                      className="px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canResend(r.status) && (
                          <button
                            type="button"
                            onClick={() => handleResend(r.id)}
                            disabled={isPending && resendingId === r.id}
                            className="border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            {resendingId === r.id
                              ? "Mengirim..."
                              : resendLabel(r.status)}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          className="border-2 border-[#D91E36] bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D91E36] hover:bg-[#D91E36] hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                      {feedback[r.id] && (
                        <p className="mt-1 text-[10px] font-bold text-[#1F4B33]">
                          {feedback[r.id]}
                        </p>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr
                      key={`${r.id}-detail`}
                      className="border-b-2 border-black/10"
                    >
                      <td colSpan={11} className="p-0">
                        <DetailPanel r={r} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-8 text-center text-black/40"
                >
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card — mobile: ringkas seperti biasa, diketuk buat buka panel detail lengkap */}
      <div className="flex max-h-[520px] flex-col overflow-hidden border-t-4 border-black sm:hidden">
        <div className="divide-y-2 divide-black/10 overflow-y-auto">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;

            return (
              <div key={r.id}>
                <button
                  type="button"
                  onClick={() => toggleExpanded(r.id)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-black/40">
                        {isOpen ? "▾" : "▸"}
                      </span>
                      <span
                        className={cn(
                          spaceMono.className,
                          "shrink-0 text-sm font-bold",
                        )}
                      >
                        {r.bib_number ?? "-"}
                      </span>
                      <span className="truncate text-sm font-bold">
                        {r.nama_lengkap}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 border-2 border-black px-2 py-0.5 text-[9px] font-bold uppercase",
                        STATUS_COLOR[r.status],
                      )}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate pl-5 text-[11px] text-black/50">
                    {r.email}
                  </p>
                </button>

                {isOpen && (
                  <div>
                    <DetailPanel r={r} />
                    <div className="space-y-2 border-t-4 border-black bg-[#FFF7DA] px-4 pb-4 pt-4">
                      <div className="flex gap-2">
                        {canResend(r.status) && (
                          <button
                            type="button"
                            onClick={() => handleResend(r.id)}
                            disabled={isPending && resendingId === r.id}
                            className="flex-1 border-2 border-black bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            {resendingId === r.id
                              ? "Mengirim..."
                              : resendLabel(r.status)}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          className="flex-1 border-2 border-[#D91E36] bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#D91E36] hover:bg-[#D91E36] hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                      {feedback[r.id] && (
                        <p className="text-[11px] font-bold text-[#1F4B33]">
                          {feedback[r.id]}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-black/40">
              Tidak ada data yang cocok.
            </p>
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteRegistrationModal
          registrationId={deleteTarget.id}
          namaLengkap={deleteTarget.nama_lengkap}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
