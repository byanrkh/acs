"use client";

import { useState, useTransition } from "react";
import { FaBolt, FaCheck, FaQrcode, FaWallet } from "react-icons/fa";
import { FaBuildingColumns, FaTriangleExclamation } from "react-icons/fa6";
import {
  setPaymentMethodEnabled,
  type PaymentMethodAdminRow,
  type PaymentMethodId,
} from "@/libs/actions/paymentSettings";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

const METHOD_ICON: Record<PaymentMethodId, React.ReactNode> = {
  gopay: <FaWallet size={14} />,
  qris: <FaQrcode size={14} />,
  permata: <FaBuildingColumns size={14} />,
  mandiri: <FaBuildingColumns size={14} />,
  bni: <FaBuildingColumns size={14} />,
  bri: <FaBuildingColumns size={14} />,
  bsi: <FaBuildingColumns size={14} />,
};

const METHOD_ACCENT: Record<PaymentMethodId, string> = {
  gopay: "#00AA13",
  qris: "#D91E36",
  permata: "#1F4B33",
  mandiri: "#003D79",
  bni: "#F58220",
  bri: "#00529C",
  bsi: "#1F4B33",
};

function formatUpdatedAt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function MethodSwitch({
  checked,
  onToggle,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative h-8 w-14 shrink-0 border-4 border-black transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#7ED957]" : "bg-black/10",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-5 w-5 -translate-y-1/2 border-2 border-black bg-white transition-all",
          checked ? "left-[calc(100%-1.6rem)]" : "left-1",
        )}
      />
    </button>
  );
}

function MethodRow({
  row,
  onToggled,
}: {
  row: PaymentMethodAdminRow;
  onToggled: (id: PaymentMethodId, enabled: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !row.enabled;
    setError(null);
    onToggled(row.id, next);

    startTransition(async () => {
      const result = await setPaymentMethodEnabled(row.id, next);
      if (!result.ok) {
        onToggled(row.id, row.enabled);
        setError(result.error);
      }
    });
  }

  const updatedLabel = formatUpdatedAt(row.updatedAt);

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-2 border-black/10 bg-white p-3 transition-opacity",
        isPending && "opacity-60",
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black text-white"
        style={{ backgroundColor: METHOD_ACCENT[row.id] }}
        aria-hidden
      >
        {METHOD_ICON[row.id]}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            SpecialGhotic.className,
            "truncate text-xs uppercase tracking-tight text-black sm:text-[13px]",
          )}
        >
          {row.label}
        </p>
        <p
          className={cn(
            spaceMono.className,
            "mt-0.5 truncate text-[10px] uppercase tracking-widest",
            row.enabled ? "text-[#1F4B33]" : "text-black/40",
          )}
        >
          {row.enabled ? "Aktif untuk peserta" : "Disembunyikan dari peserta"}
          {updatedLabel ? ` · diubah ${updatedLabel}` : ""}
        </p>
        {error && (
          <p
            className={cn(
              spaceMono.className,
              "mt-1 flex items-center gap-1 text-[10px] text-[#D91E36]",
            )}
          >
            <FaTriangleExclamation size={10} /> {error}
          </p>
        )}
      </div>

      <MethodSwitch
        checked={row.enabled}
        onToggle={handleToggle}
        disabled={isPending}
      />
    </div>
  );
}

export default function PaymentMethodSettingsCard({
  initialRows,
}: {
  initialRows: PaymentMethodAdminRow[];
}) {
  const [rows, setRows] = useState(initialRows);

  function handleToggled(id: PaymentMethodId, enabled: boolean) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, enabled } : row)),
    );
  }

  const instantRows = rows.filter((row) => row.group === "instan");
  const vaRows = rows.filter((row) => row.group === "va");
  const activeCount = rows.filter((row) => row.enabled).length;

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-black bg-[#7ED957] px-4 py-3">
        <h2
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-black sm:text-base",
          )}
        >
          Metode Pembayaran
        </h2>
        <span
          className={cn(
            spaceMono.className,
            "border-2 border-black bg-white px-2 py-1 text-[10px] uppercase tracking-widest text-black",
          )}
        >
          {activeCount}/{rows.length} aktif
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p
            className={cn(
              spaceMono.className,
              "mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-black/40",
            )}
          >
            <FaBolt size={10} /> Bayar Instan
          </p>
          <div className="space-y-2">
            {instantRows.map((row) => (
              <MethodRow key={row.id} row={row} onToggled={handleToggled} />
            ))}
          </div>
        </div>

        <div>
          <p
            className={cn(
              spaceMono.className,
              "mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-black/40",
            )}
          >
            <FaBuildingColumns size={10} /> Transfer Virtual Account
          </p>
          <div className="space-y-2">
            {vaRows.map((row) => (
              <MethodRow key={row.id} row={row} onToggled={handleToggled} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
