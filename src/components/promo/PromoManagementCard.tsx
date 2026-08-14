"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaFolder,
  FaFolderPlus,
  FaChevronRight,
  FaHome,
  FaSearch,
  FaTicketAlt,
  FaEllipsisV,
  FaPen,
  FaExchangeAlt,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
  FaLayerGroup,
  FaBolt,
  FaFire,
} from "react-icons/fa";
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

type PromoBadge = { label: string; className: string; barColor: string };

function getPromoBadge(promo: PromoAdminRow): PromoBadge {
  if (!promo.is_active) {
    return {
      label: "Non-Aktif",
      className: "bg-black/10 text-black/60",
      barColor: "bg-black/20",
    };
  }
  const now = Date.now();
  const start = new Date(promo.start_date).getTime();
  const end = new Date(promo.end_date).getTime();
  if (promo.current_uses >= promo.max_uses) {
    return {
      label: "Kuota Habis",
      className: "bg-[#D91E36] text-white",
      barColor: "bg-[#D91E36]",
    };
  }
  if (now > end) {
    return {
      label: "Expired",
      className: "bg-black/10 text-black/60",
      barColor: "bg-black/20",
    };
  }
  if (now < start) {
    return {
      label: "Belum Mulai",
      className: "bg-[#FFD400] text-black",
      barColor: "bg-[#FFD400]",
    };
  }
  return {
    label: "Aktif",
    className: "bg-[#7ED957] text-black",
    barColor: "bg-[#7ED957]",
  };
}

function getChildFolderPaths(
  allFolders: string[],
  currentPath: string,
): string[] {
  const prefix = currentPath === "/" ? "/" : `${currentPath}/`;
  const children = new Set<string>();

  allFolders.forEach((folder) => {
    if (folder === currentPath) return;
    if (!folder.startsWith(prefix)) return;

    const rest = folder.slice(prefix.length);
    const segment = rest.split("/")[0];
    if (!segment) return;

    const childPath =
      currentPath === "/" ? `/${segment}` : `${currentPath}/${segment}`;
    children.add(childPath);
  });

  return Array.from(children).sort();
}

function getBreadcrumbSegments(
  path: string,
): { label: string; path: string }[] {
  if (path === "/") return [{ label: "Home", path: "/" }];
  const parts = path.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", path: "/" }];
  let acc = "";
  for (const part of parts) {
    acc += `/${part}`;
    crumbs.push({ label: part, path: acc });
  }
  return crumbs;
}

export default function PromoManagementCard() {
  const [promos, setPromos] = useState<PromoAdminRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("/");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

  const allFolders = useMemo(() => {
    const unique = new Set<string>(["/"]);
    promos.forEach((p) => unique.add(p.folder));
    return Array.from(unique);
  }, [promos]);

  const childFolders = useMemo(
    () => getChildFolderPaths(allFolders, currentPath),
    [allFolders, currentPath],
  );

  const promosHere = useMemo(() => {
    const inFolder = promos.filter((p) => p.folder === currentPath);
    const query = searchQuery.trim().toUpperCase();
    if (!query) return inFolder;
    return inFolder.filter((p) => p.code.includes(query));
  }, [promos, currentPath, searchQuery]);

  function countPromosUnder(folderPath: string) {
    const prefix = `${folderPath}/`;
    return promos.filter(
      (p) => p.folder === folderPath || p.folder.startsWith(prefix),
    ).length;
  }

  const breadcrumbs = getBreadcrumbSegments(currentPath);
  const parentPath =
    currentPath === "/" ? null : breadcrumbs[breadcrumbs.length - 2].path;

  const stats = useMemo(() => {
    const totalActive = promos.filter((p) => p.is_active).length;
    const totalUsage = promos.reduce((sum, p) => sum + p.current_uses, 0);
    const totalQuota = promos.reduce((sum, p) => sum + p.max_uses, 0);
    return { total: promos.length, totalActive, totalUsage, totalQuota };
  }, [promos]);

  function handleSaved(promo: PromoAdminRow) {
    setPromos((prev) => {
      const exists = prev.some((p) => p.id === promo.id);
      if (exists) return prev.map((p) => (p.id === promo.id ? promo : p));
      return [promo, ...prev];
    });
    setCurrentPath(promo.folder);
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
    setOpenMenuId(null);
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
    setOpenMenuId(null);
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

  function handleNewFolder() {
    const name = window.prompt(
      "Nama folder baru (di dalam folder yang lagi dibuka):",
    );
    if (!name) return;
    const clean = name.trim().replace(/^\/+|\/+$/g, "");
    if (!clean) return;
    const newPath =
      currentPath === "/" ? `/${clean}` : `${currentPath}/${clean}`;
    setCurrentPath(newPath);
  }

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black bg-[#FF5A1F] px-4 py-3 sm:px-5">
        <h2
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-black sm:text-base",
          )}
        >
          Manajemen Promo
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleNewFolder}
            className={cn(
              SpecialGhotic.className,
              "flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-[11px] uppercase tracking-tight text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            )}
          >
            <FaFolderPlus size={11} /> Folder
          </button>
          <button
            type="button"
            onClick={() => setModalState({ mode: "create" })}
            className={cn(
              SpecialGhotic.className,
              "flex items-center gap-1.5 border-2 border-black bg-black px-3 py-1.5 text-[11px] uppercase tracking-tight text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            )}
          >
            + Promo
          </button>
        </div>
      </div>

      {/* Stats ringkas */}
      <div className="grid grid-cols-3 divide-x-4 divide-black border-b-4 border-black bg-[#FDF6E9]">
        <div className="flex items-center gap-2.5 px-3 py-3 sm:px-5">
          <FaLayerGroup className="shrink-0 text-black/40" size={16} />
          <div className="min-w-0">
            <p
              className={cn(
                SpecialGhotic.className,
                "text-base leading-none text-black sm:text-lg",
              )}
            >
              {stats.total}
            </p>
            <p
              className={cn(
                spaceMono.className,
                "text-[10px] uppercase text-black/50",
              )}
            >
              Total Promo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-3 sm:px-5">
          <FaBolt className="shrink-0 text-[#7ED957]" size={16} />
          <div className="min-w-0">
            <p
              className={cn(
                SpecialGhotic.className,
                "text-base leading-none text-black sm:text-lg",
              )}
            >
              {stats.totalActive}
            </p>
            <p
              className={cn(
                spaceMono.className,
                "text-[10px] uppercase text-black/50",
              )}
            >
              Aktif
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-3 sm:px-5">
          <FaFire className="shrink-0 text-[#FF5A1F]" size={16} />
          <div className="min-w-0">
            <p
              className={cn(
                SpecialGhotic.className,
                "truncate text-base leading-none text-black sm:text-lg",
              )}
            >
              {stats.totalUsage}/{stats.totalQuota}
            </p>
            <p
              className={cn(
                spaceMono.className,
                "text-[10px] uppercase text-black/50",
              )}
            >
              Kuota Terpakai
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb + search */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black bg-white px-4 py-3 sm:px-5">
        <div
          className={cn(
            spaceMono.className,
            "flex flex-wrap items-center gap-1.5 text-xs",
          )}
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPath(crumb.path)}
                className={cn(
                  "flex items-center gap-1 font-bold hover:underline",
                  i === breadcrumbs.length - 1 ? "text-black" : "text-black/45",
                )}
              >
                {i === 0 && <FaHome size={10} />}
                {crumb.label}
              </button>
              {i < breadcrumbs.length - 1 && (
                <FaChevronRight className="text-black/25" size={9} />
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 border-2 border-black bg-[#FDF6E9] px-3 py-1.5">
          <FaSearch className="text-black/30" size={11} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode di folder ini..."
            className={cn(
              spaceMono.className,
              "w-40 bg-transparent text-xs text-black placeholder:text-black/35 outline-none sm:w-52",
            )}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center gap-2 p-10">
          <FaTicketAlt className="animate-pulse text-black/20" size={22} />
          <p className="text-sm text-black/40">Memuat daftar promo...</p>
        </div>
      )}

      {loadError && (
        <p className="p-6 text-center text-sm font-bold text-[#D91E36]">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && (
        <>
          {/* Folder grid -- selalu di atas, sebelum promo */}
          {(parentPath !== null || childFolders.length > 0) && (
            <div className="grid grid-cols-2 gap-3 border-b-4 border-black bg-[#FDF6E9] p-4 sm:grid-cols-3 sm:p-5 md:grid-cols-4 lg:grid-cols-5">
              {parentPath !== null && (
                <button
                  type="button"
                  onClick={() => setCurrentPath(parentPath)}
                  className="flex flex-col items-center gap-2 border-2 border-dashed border-black/40 bg-white p-4 text-black/50 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-black hover:text-black"
                >
                  <FaChevronRight className="rotate-180" size={20} />
                  <span
                    className={cn(spaceMono.className, "text-[10px] uppercase")}
                  >
                    Kembali
                  </span>
                </button>
              )}

              {childFolders.map((folderPath) => {
                const label =
                  folderPath.split("/").filter(Boolean).pop() ?? folderPath;
                return (
                  <button
                    key={folderPath}
                    type="button"
                    onClick={() => setCurrentPath(folderPath)}
                    className="group flex flex-col items-center gap-2 border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <FaFolder
                      className="text-[#FFD400] drop-shadow-sm"
                      size={30}
                    />
                    <span
                      className={cn(
                        SpecialGhotic.className,
                        "w-full truncate text-center text-xs uppercase tracking-tight text-black",
                      )}
                      title={label}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        spaceMono.className,
                        "text-[10px] text-black/40",
                      )}
                    >
                      {countPromosUnder(folderPath)} promo
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Promo langsung di folder ini */}
          {promosHere.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <FaTicketAlt className="text-black/15" size={26} />
              <p className="text-sm text-black/40">
                {searchQuery
                  ? `Gak ada promo yang cocok dengan "${searchQuery}" di folder ini.`
                  : "Belum ada promo langsung di folder ini."}
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black/10">
              {promosHere.map((promo) => {
                const badge = getPromoBadge(promo);
                const pct = Math.min(
                  100,
                  Math.round(
                    (promo.current_uses / Math.max(promo.max_uses, 1)) * 100,
                  ),
                );
                const isMenuOpen = openMenuId === promo.id;

                return (
                  <div
                    key={promo.id}
                    className="relative flex flex-col gap-3 p-4 hover:bg-[#FDF6E9]/60 sm:flex-row sm:items-center sm:gap-5 sm:px-5"
                  >
                    <div className="flex shrink-0 items-center gap-3 sm:w-52">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[#FFD400]">
                        <FaTicketAlt className="text-black" size={15} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            SpecialGhotic.className,
                            "truncate text-sm uppercase tracking-tight text-black",
                          )}
                        >
                          {promo.code}
                        </p>
                        <p
                          className={cn(
                            spaceMono.className,
                            "text-[11px] text-black/50",
                          )}
                        >
                          {promo.discount_type === "percentage"
                            ? `${promo.discount_value}% off`
                            : `${formatRupiah(promo.discount_value)} off`}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-[140px] flex-1">
                      <div
                        className={cn(
                          spaceMono.className,
                          "mb-1 flex items-center justify-between text-[10px] uppercase text-black/45",
                        )}
                      >
                        <span>Kuota</span>
                        <span>
                          {promo.current_uses}/{promo.max_uses}
                        </span>
                      </div>
                      <div className="h-2.5 w-full border-2 border-black bg-white">
                        <div
                          className={cn(
                            "h-full transition-all",
                            badge.barColor,
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4 sm:w-56 sm:justify-between">
                      <span
                        className={cn(
                          "border-2 border-black px-2 py-1 text-[10px] font-bold uppercase",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                      <span
                        className={cn(
                          spaceMono.className,
                          "text-[11px] text-black/50",
                        )}
                      >
                        {formatDate(promo.start_date)} –{" "}
                        {formatDate(promo.end_date)}
                      </span>
                    </div>

                    <div className="absolute right-4 top-4 shrink-0 sm:static">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(isMenuOpen ? null : promo.id)
                        }
                        className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white hover:bg-[#FDF6E9]"
                        aria-label="Aksi lainnya"
                      >
                        <FaEllipsisV size={12} />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className={cn(
                              spaceMono.className,
                              "absolute right-0 top-9 z-50 w-44 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setModalState({ mode: "edit", promo });
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-[#FDF6E9]"
                            >
                              <FaPen size={11} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setModalState({ mode: "move", promo });
                              }}
                              className="flex w-full items-center gap-2 border-t-2 border-black/10 px-3 py-2.5 text-left text-xs hover:bg-[#FDF6E9]"
                            >
                              <FaExchangeAlt size={11} /> Pindahkan
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggle(promo)}
                              className="flex w-full items-center gap-2 border-t-2 border-black/10 px-3 py-2.5 text-left text-xs hover:bg-[#FDF6E9]"
                            >
                              {promo.is_active ? (
                                <FaToggleOff size={13} />
                              ) : (
                                <FaToggleOn size={13} />
                              )}
                              {promo.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(promo)}
                              className="flex w-full items-center gap-2 border-t-2 border-black/10 px-3 py-2.5 text-left text-xs text-[#D91E36] hover:bg-[#D91E36]/10"
                            >
                              <FaTrash size={11} /> Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {rowError?.id === promo.id && (
                      <p className="text-[11px] text-[#D91E36] sm:absolute sm:bottom-1.5 sm:right-14">
                        {rowError.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {modalState.mode === "create" && (
        <PromoFormModal
          promo={null}
          defaultFolder={currentPath}
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
          existingFolders={allFolders.sort()}
          onClose={() => setModalState({ mode: "closed" })}
          onMoved={handleMoved}
        />
      )}
    </div>
  );
}
