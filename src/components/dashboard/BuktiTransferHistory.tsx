"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import { BiZoomIn } from "react-icons/bi";

export type HistoryStatus =
  | "pending_payment"
  | "waiting_verification"
  | "confirmed"
  | "cancelled"
  | "expired";

export type HistoryRow = {
  id: string;
  nama_lengkap: string;
  kategori: "pelajar" | "umum";
  ukuran_jersey: string;
  nomor_urut: number | null;
  bukti_transfer: string | null;
  created_at: string;
  status: HistoryStatus;
  grossAmount: number;
};

type StatusFilter = "semua" | HistoryStatus;
const ROW_HEIGHT = 88;
const VIEWPORT_HEIGHT = 560;
const OVERSCAN = 6;

const STATUS_LABEL: Record<HistoryStatus, string> = {
  pending_payment: "Menunggu Pembayaran",
  waiting_verification: "Menunggu Verifikasi",
  confirmed: "Terkonfirmasi",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

const STATUS_BADGE_CLASS: Record<HistoryStatus, string> = {
  pending_payment: "border-black/30 bg-black/5 text-black/60",
  waiting_verification: "border-[#FFD400] bg-[#FFD400]/20 text-black",
  confirmed: "border-[#1F4B33] bg-[#1F4B33]/10 text-[#1F4B33]",
  cancelled: "border-[#D91E36] bg-[#D91E36]/10 text-[#D91E36]",
  expired: "border-black/30 bg-black/5 text-black/50",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTanggal(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function BuktiTransferHistory({
  items,
}: {
  items: HistoryRow[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [lightbox, setLightbox] = useState<{
    url: string;
    nama: string;
  } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchStatus =
        statusFilter === "semua" || item.status === statusFilter;
      const matchSearch =
        query.length === 0 || item.nama_lengkap.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [items, search, statusFilter]);

  useEffect(() => {
    setScrollTop(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [search, statusFilter]);

  const totalHeight = filtered.length * ROW_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    filtered.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  );
  const visibleRows = filtered.slice(startIndex, endIndex);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    setScrollTop(e.currentTarget.scrollTop);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          className={cn(
            SpecialGhotic.className,
            "text-lg uppercase tracking-tight sm:text-xl",
          )}
        >
          Riwayat Bukti Transfer ({filtered.length})
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama peserta..."
            className={cn(
              spaceMono.className,
              "w-full border-2 border-black bg-white px-3 py-1.5 text-xs outline-none placeholder:text-black/40 sm:w-56",
            )}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={cn(
              spaceMono.className,
              "w-full border-2 border-black bg-white px-3 py-1.5 text-xs outline-none sm:w-auto",
            )}
          >
            <option value="semua">Semua status</option>
            <option value="waiting_verification">Menunggu Verifikasi</option>
            <option value="confirmed">Terkonfirmasi</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="expired">Kedaluwarsa</option>
            <option value="pending_payment">Menunggu Pembayaran</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border-4 border-black bg-white p-6 text-center text-sm text-black/60 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Belum ada bukti transfer yang cocok dengan filter ini.
        </div>
      ) : (
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div
            className={cn(
              spaceMono.className,
              "hidden border-b-4 border-black bg-[#FFD400] px-3 py-3 text-[11px] font-bold uppercase sm:grid sm:grid-cols-[64px_1.5fr_1fr_1.2fr_1fr]",
            )}
          >
            <span></span>
            <span>Nama</span>
            <span>Kategori</span>
            <span>Nominal + Kode Unik</span>
            <span>Status</span>
          </div>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{ height: VIEWPORT_HEIGHT }}
            className="overflow-y-auto overscroll-contain"
          >
            <div
              style={{ height: totalHeight, position: "relative" }}
              className={cn(spaceMono.className, "text-xs")}
            >
              {visibleRows.map((row, i) => {
                const absoluteIndex = startIndex + i;
                return (
                  <div
                    key={row.id}
                    style={{
                      position: "absolute",
                      top: absoluteIndex * ROW_HEIGHT,
                      left: 0,
                      right: 0,
                      height: ROW_HEIGHT,
                    }}
                    className="grid grid-cols-[64px_1fr_auto] items-center gap-3 border-b-2 border-black/10 px-3 py-2 sm:grid-cols-[64px_1.5fr_1fr_1.2fr_1fr] sm:gap-0"
                  >
                    <div>
                      {row.bukti_transfer ? (
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              url: row.bukti_transfer as string,
                              nama: row.nama_lengkap,
                            })
                          }
                          className="group relative block h-16 w-16 shrink-0 border-2 border-black"
                        >
                          <img
                            src={row.bukti_transfer}
                            alt={`Bukti transfer ${row.nama_lengkap}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                            <BiZoomIn />
                          </span>
                        </button>
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center border-2 border-dashed border-black/20 text-black/30">
                          -
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 ml-0 sm:ml-3">
                      <p className="truncate font-bold">{row.nama_lengkap}</p>
                      <p className="truncate text-black/40 sm:hidden">
                        {row.kategori} · {formatRupiah(row.grossAmount)}
                      </p>
                      <p className="text-black/40">
                        {formatTanggal(row.created_at)}
                      </p>
                    </div>

                    <div className="hidden capitalize sm:block">
                      {row.kategori}
                    </div>

                    <div className="hidden sm:block">
                      {formatRupiah(row.grossAmount)}
                      <br />
                      <span className="text-black/50">
                        Kode unik: {row.nomor_urut ?? 0}
                      </span>
                    </div>

                    <div>
                      <span
                        className={cn(
                          "inline-block border-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                          STATUS_BADGE_CLASS[row.status],
                        )}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-full max-w-3xl border-4 border-black bg-white p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className={cn(
                SpecialGhotic.className,
                "absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center border-4 border-black bg-[#D91E36] text-lg text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
              )}
              aria-label="Tutup"
            >
              ✕
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={`Bukti transfer ${lightbox.nama}`}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />

            <p
              className={cn(
                spaceMono.className,
                "mt-2 text-center text-xs uppercase tracking-widest text-black/60",
              )}
            >
              Bukti transfer — {lightbox.nama}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
