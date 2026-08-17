"use client";

import { useState, useTransition } from "react";
import { deleteRegistration } from "@/libs/actions/admin";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function DeleteRegistrationModal({
  registrationId,
  namaLengkap,
  onClose,
  onDeleted,
}: {
  registrationId: string;
  namaLengkap: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMatch = confirmText.trim() === namaLengkap.trim();

  function handleDelete() {
    if (!isMatch) return;
    setErrorMessage(null);

    startTransition(async () => {
      const result = await deleteRegistration(registrationId);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      onDeleted(registrationId);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md border-4 border-black bg-[#FDF6E9] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-4 border-black bg-[#D91E36] px-5 py-4">
          <h2
            className={cn(
              SpecialGhotic.className,
              "text-sm uppercase tracking-tight text-white sm:text-base",
            )}
          >
            Hapus Data Peserta
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-lg font-bold text-white/70 hover:text-white disabled:opacity-50"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label
              className={cn(
                spaceMono.className,
                "block text-[10px] uppercase tracking-widest text-black/50",
              )}
            >
              Ketik <span className="font-bold">{namaLengkap}</span> untuk
              konfirmasi
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={namaLengkap}
              autoComplete="off"
              disabled={isPending}
              className="mt-1.5 w-full border-4 border-black bg-white px-3 py-2 text-sm outline-none focus:bg-[#FFF7DA] disabled:opacity-50"
            />
          </div>

          {errorMessage && (
            <p className={cn(spaceMono.className, "text-xs text-[#D91E36]")}>
              {errorMessage}
            </p>
          )}

          <p className="text-xs text-black/70">
            Kamu akan menghapus permanen data peserta berikut. Tindakan ini{" "}
            <span className="font-bold text-[#D91E36]/70">
              tidak bisa dibatalkan
            </span>
            .
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={cn(
                SpecialGhotic.className,
                "flex-1 border-4 cursor-pointer border-black bg-white px-4 py-3 text-xs uppercase tracking-tight text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50",
              )}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isMatch || isPending}
              className={cn(
                SpecialGhotic.className,
                "flex-1 border-4 cursor-pointer border-black bg-[#D91E36] px-4 py-3 text-xs uppercase tracking-tight text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50",
              )}
            >
              {isPending ? "Menghapus..." : "Hapus Permanen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
