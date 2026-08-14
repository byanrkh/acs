"use client";

import { useState, useTransition } from "react";
import {
  movePromoToFolder,
  type PromoAdminRow,
} from "@/libs/actions/promo/admin";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function MovePromoModal({
  promo,
  existingFolders,
  onClose,
  onMoved,
}: {
  promo: PromoAdminRow;
  /** Daftar folder yang udah ada (buat quick-pick), termasuk "/". */
  existingFolders: string[];
  onClose: () => void;
  onMoved: (promoId: string, folder: string) => void;
}) {
  const [folder, setFolder] = useState(promo.folder);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await movePromoToFolder(promo.id, folder);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      onMoved(promo.id, result.data.folder);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm border-4 border-black bg-[#FDF6E9] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-4 border-black bg-black px-5 py-4">
          <h2
            className={cn(
              SpecialGhotic.className,
              "text-sm uppercase tracking-tight text-white",
            )}
          >
            Pindahkan — {promo.code}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg font-bold text-white/70 hover:text-white"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label
              className={cn(
                SpecialGhotic.className,
                "mb-1.5 block text-xs uppercase tracking-tight text-black",
              )}
            >
              Folder Tujuan
            </label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="/ atau /collab"
              className={cn(
                spaceMono.className,
                "w-full border-4 border-black bg-white px-3 py-2.5 text-sm text-black outline-none",
              )}
            />
            <p
              className={cn(
                spaceMono.className,
                "mt-1 text-[11px] text-black/50",
              )}
            >
              Ketik folder baru juga bisa, otomatis kebuat.
            </p>
          </div>

          {existingFolders.length > 0 && (
            <div>
              <p
                className={cn(
                  spaceMono.className,
                  "mb-1.5 text-[11px] uppercase text-black/50",
                )}
              >
                Folder yang sudah ada:
              </p>
              <div className="flex flex-wrap gap-2">
                {existingFolders.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFolder(f)}
                    className={cn(
                      spaceMono.className,
                      "border-2 border-black px-2 py-1 text-[11px]",
                      f === folder
                        ? "bg-[#FF5A1F] text-black"
                        : "bg-white text-black hover:bg-[#FDF6E9]",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <p className={cn(spaceMono.className, "text-xs text-[#D91E36]")}>
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={cn(
                SpecialGhotic.className,
                "flex-1 border-4 border-black bg-white px-4 py-2.5 text-xs uppercase tracking-tight text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50",
              )}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                SpecialGhotic.className,
                "flex-1 border-4 border-black bg-[#FF5A1F] px-4 py-2.5 text-xs uppercase tracking-tight text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50",
              )}
            >
              {isPending ? "Memindahkan..." : "Pindahkan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
