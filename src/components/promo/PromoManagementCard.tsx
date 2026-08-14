"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listPromos,
  deletePromo,
  togglePromoActive,
  type PromoAdminRow,
} from "@/libs/actions/promo/admin";
import PromoFormModal from "@/components/promo/PromoFormModal";
import MovePromoModal from "@/components/promo/MovePromoModal";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type PromoBadge = {
  label: string;
  className: string;
};

function getPromoBadge(promo: PromoAdminRow): PromoBadge {
  if (!promo.is_active) {
    return { label: "Non-Aktif", className: "bg-black/10 text-black/60" };
  }

  const now = Date.now();
  const start = new Date(promo.start_date).getTime();
  const end = new Date(promo.end_date).getTime();

  if (promo.current_uses >= promo.max_uses) {
    return { label: "Kuota Habis", className: "bg-[#D91E36] text-white" };
  }
  if (now > end) {
    return { label: "Expired", className: "bg-black/10 text-black/60" };
  }
  if (now < start) {
    return { label: "Belum Mulai", className: "bg-[#FFD400] text-black" };
  }
  return { label: "Aktif", className: "bg-[#7ED957] text-black" };
}

export default function PromoManagementCard() {
  const [promos, setPromos] = useState<PromoAdminRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState("/");
  const [modalState, setModalState] = useState<
    | { mode: "closed" }
    | { mode: "create" }
    | { mode: "edit"; promo: PromoAdminRow }
    | { mode: "move"; promo: PromoAdminRow }
  >({ mode: "closed" });
  const [rowError, setRowError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    void loadPromos();
  }, []);

  async function loadPromos() {
    setIsLoading(true);
    const result = await listPromos();
    setIsLoading(false);

    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    setLoadError(null);
    setPromos(result.data);
  }

  // Folder itu cuma nilai unik dari promos[].folder -- "/" selalu ada
  // biar tetep ada tab default walau belum ada promo sama sekali.
  const folders = useMemo(() => {
    const unique = new Set<string>(["/"]);
    promos.forEach((p) => unique.add(p.folder));
    return Array.from(unique).sort((a, b) =>
      a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b),
    );
  }, [promos]);

  const visiblePromos = useMemo(
    () => promos.filter((p) => p.folder === activeFolder),
    [promos, activeFolder],
  );

  function handleSaved(promo: PromoAdminRow) {
    setPromos((prev) => {
      const exists = prev.some((p) => p.id === promo.id);
      if (exists) return prev.map((p) => (p.id === promo.id ? promo : p));
      return [promo, ...prev];
    });
    setActiveFolder(promo.folder);
    setModalState({ mode: "closed" });
  }

  function handleMoved(promoId: string, folder: string) {
    setPromos((prev) =>
      prev.map((p) => (p.id === promoId ? { ...p, folder } : p)),
    );
    setModalState({ mode: "closed" });
  }

  function handleToggle(promo: PromoAdminRow) {
    setRowError(null);
    void (async () => {
      const result = await togglePromoActive(promo.id, !promo.is_active);
      if (!result.ok) {
        setRowError({ id: promo.id, message: result.error });
        return;
      }
      setPromos((prev) =>
        prev.map((p) =>
          p.id === promo.id ? { ...p, is_active: result.data.is_active } : p,
        ),
      );
    })();
  }

  function handleDelete(promo: PromoAdminRow) {
    const confirmed = window.confirm(
      `Hapus kode promo "${promo.code}"? Registrasi yang sudah pernah pakai kode ini tetap aman (data diskon historisnya tidak berubah), tapi kode ini tidak akan bisa dipakai lagi.`,
    );
    if (!confirmed) return;

    setRowError(null);
    void (async () => {
      const result = await deletePromo(promo.id);
      if (!result.ok) {
        setRowError({ id: promo.id, message: result.error });
        return;
      }
      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
    })();
  }

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-4 border-black bg-[#FF5A1F] px-4 py-3">
        <h2
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-black sm:text-base",
          )}
        >
          Promo ({promos.length})
        </h2>
        <button
          type="button"
          onClick={() => setModalState({ mode: "create" })}
          className={cn(
            SpecialGhotic.className,
            "border-2 border-black bg-black px-3 py-1.5 text-[11px] uppercase tracking-tight text-white hover:bg-black/80",
          )}
        >
          + Tambah Promo
        </button>
      </div>

      {/* Tab folder */}
      <div className="flex flex-wrap gap-2 border-b-4 border-black bg-[#FDF6E9] px-4 py-3">
        {folders.map((folder) => {
          const count = promos.filter((p) => p.folder === folder).length;
          const isActive = folder === activeFolder;
          return (
            <button
              key={folder}
              type="button"
              onClick={() => setActiveFolder(folder)}
              className={cn(
                spaceMono.className,
                "border-2 border-black px-3 py-1.5 text-[11px] font-bold",
                isActive
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-black/5",
              )}
            >
              {folder} ({count})
            </button>
          );
        })}
      </div>

      {isLoading && (
        <p className="p-6 text-center text-sm text-black/40">
          Memuat daftar promo...
        </p>
      )}

      {loadError && (
        <p className="p-6 text-center text-sm font-bold text-[#D91E36]">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && visiblePromos.length === 0 && (
        <p className="p-6 text-center text-sm text-black/40">
          Belum ada promo di folder &quot;{activeFolder}&quot;.
        </p>
      )}

      {!isLoading && !loadError && visiblePromos.length > 0 && (
        <div className="overflow-x-auto">
          <table
            className={cn(spaceMono.className, "w-full min-w-[820px] text-xs")}
          >
            <thead>
              <tr className="border-b-4 border-black bg-[#FDF6E9] text-left uppercase">
                <th className="px-3 py-3">Kode</th>
                <th className="px-3 py-3">Tipe</th>
                <th className="px-3 py-3">Nilai</th>
                <th className="px-3 py-3">Kuota</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Berlaku</th>
                <th className="px-3 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visiblePromos.map((promo) => {
                const badge = getPromoBadge(promo);
                return (
                  <tr
                    key={promo.id}
                    className="border-b-2 border-black/10 align-top"
                  >
                    <td className="px-3 py-3 font-bold">{promo.code}</td>
                    <td className="px-3 py-3 capitalize">
                      {promo.discount_type}
                    </td>
                    <td className="px-3 py-3">
                      {promo.discount_type === "percentage"
                        ? `${promo.discount_value}%`
                        : formatRupiah(promo.discount_value)}
                    </td>
                    <td className="px-3 py-3">
                      {promo.current_uses}/{promo.max_uses} Terpakai
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "border-2 border-black px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-black/60">
                      {formatDate(promo.start_date)} –{" "}
                      {formatDate(promo.end_date)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setModalState({ mode: "edit", promo })}
                          className="border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-[#FDF6E9]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalState({ mode: "move", promo })}
                          className="border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-[#FDF6E9]"
                        >
                          Pindahkan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(promo)}
                          className="border-2 border-black bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-[#FDF6E9]"
                        >
                          {promo.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
                          className="border-2 border-black bg-[#D91E36] px-2 py-1 text-[10px] font-bold uppercase text-white hover:bg-[#D91E36]/80"
                        >
                          Hapus
                        </button>
                      </div>
                      {rowError?.id === promo.id && (
                        <p className="mt-2 text-[10px] text-[#D91E36]">
                          {rowError.message}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalState.mode === "create" && (
        <PromoFormModal
          promo={null}
          defaultFolder={activeFolder}
          onClose={() => setModalState({ mode: "closed" })}
          onSaved={handleSaved}
        />
      )}

      {modalState.mode === "edit" && (
        <PromoFormModal
          promo={modalState.promo}
          onClose={() => setModalState({ mode: "closed" })}
          onSaved={handleSaved}
        />
      )}

      {modalState.mode === "move" && (
        <MovePromoModal
          promo={modalState.promo}
          existingFolders={folders}
          onClose={() => setModalState({ mode: "closed" })}
          onMoved={handleMoved}
        />
      )}
    </div>
  );
}
