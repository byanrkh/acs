"use client";

import { useState, useTransition } from "react";
import FormField from "@/components/form/FormField";
import RadioTabs from "@/components/form/RadioTabs";
import {
  createPromo,
  updatePromo,
  type PromoAdminRow,
  type PromoFormInput,
} from "@/libs/actions/promo/admin";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default function PromoFormModal({
  promo,
  defaultFolder,
  onClose,
  onSaved,
}: {
  /** null = mode "Tambah", ada isinya = mode "Edit". */
  promo: PromoAdminRow | null;
  /** Folder aktif saat tombol "+ Tambah Promo" ditekan (mode Tambah saja). */
  defaultFolder?: string;
  onClose: () => void;
  onSaved: (promo: PromoAdminRow) => void;
}) {
  const isEditMode = Boolean(promo);

  const [code, setCode] = useState(promo?.code ?? "");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    promo?.discount_type ?? "fixed",
  );
  const [discountValue, setDiscountValue] = useState(
    promo ? String(promo.discount_value) : "",
  );
  const [maxUses, setMaxUses] = useState(promo ? String(promo.max_uses) : "");
  const [startDate, setStartDate] = useState(
    toDatetimeLocalValue(promo?.start_date ?? null),
  );
  const [endDate, setEndDate] = useState(
    toDatetimeLocalValue(promo?.end_date ?? null),
  );
  const [isActive, setIsActive] = useState(promo?.is_active ?? true);
  const [folder, setFolder] = useState(promo?.folder ?? defaultFolder ?? "/");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const input: PromoFormInput = {
      code,
      discountType,
      discountValue: Number(discountValue),
      maxUses: Number(maxUses),
      startDate,
      endDate,
      isActive,
      folder,
    };

    startTransition(async () => {
      const result = isEditMode
        ? await updatePromo(promo!.id, input)
        : await createPromo(input);

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      onSaved(result.data);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-4 border-black bg-[#FDF6E9] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-4 border-black bg-black px-5 py-4">
          <h2
            className={cn(
              SpecialGhotic.className,
              "text-sm uppercase tracking-tight text-white sm:text-base",
            )}
          >
            {isEditMode ? `Edit Promo — ${promo?.code}` : "Tambah Promo"}
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

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <FormField
            label="Kode Promo"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MISAL: ACSHEMAT10"
            required
          />

          <FormField
            label="Folder"
            name="folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="/ atau /collab"
            required
          />

          <RadioTabs
            legend="Tipe Diskon"
            name="discountType"
            value={discountType}
            onChange={(v) => setDiscountType(v as "fixed" | "percentage")}
            options={[
              { value: "fixed", label: "Fixed (Rp)" },
              { value: "percentage", label: "Percentage (%)" },
            ]}
          />

          <FormField
            label={
              discountType === "percentage"
                ? "Nilai Diskon (%)"
                : "Nilai Diskon (Rp)"
            }
            name="discountValue"
            type="number"
            min={1}
            max={discountType === "percentage" ? 100 : undefined}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === "percentage" ? "10" : "50000"}
            required
          />

          <FormField
            label="Max Uses (Kuota)"
            name="maxUses"
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="10"
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Mulai Berlaku"
              name="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <FormField
              label="Berakhir"
              name="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 accent-[#FF5A1F]"
            />
            <span
              className={cn(
                SpecialGhotic.className,
                "text-sm uppercase tracking-tight text-black",
              )}
            >
              Aktifkan promo ini
            </span>
          </label>

          {errorMessage && (
            <p className={cn(spaceMono.className, "text-xs text-[#D91E36]")}>
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className={cn(
                SpecialGhotic.className,
                "flex-1 border-4 border-black bg-white px-4 py-3 text-xs uppercase tracking-tight text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50",
              )}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                SpecialGhotic.className,
                "flex-1 border-4 border-black bg-[#FF5A1F] px-4 py-3 text-xs uppercase tracking-tight text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50",
              )}
            >
              {isPending
                ? "Menyimpan..."
                : isEditMode
                  ? "Simpan Perubahan"
                  : "Tambah Promo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
