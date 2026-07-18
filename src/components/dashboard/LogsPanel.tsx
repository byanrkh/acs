"use client";

import { useState } from "react";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";
import type { AuditLog, PaymentLog } from "@/libs/actions/logs";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Ubah "nama_lengkap" jadi "Nama Lengkap" buat label detail.
function formatLabel(key: string) {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}

const SOURCE_LABEL: Record<string, string> = {
  webhook: "Webhook",
  reconcile: "Reconcile",
  checkout: "Checkout",
};

const SOURCE_COLOR: Record<string, string> = {
  webhook: "bg-[#7ED957]",
  reconcile: "bg-[#FFD400]",
  checkout: "bg-white",
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-[#7ED957]",
  pending_payment: "bg-[#FFD400]",
  cancelled: "bg-[#D91E36] text-white",
  expired: "bg-black/20",
};

function CardShell({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-h-[440px] flex-col border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="shrink-0 border-b-4 border-black bg-black px-4 py-3">
        <h2
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-white sm:text-base",
          )}
        >
          {title} ({count})
        </h2>
      </div>
      <div className="divide-y-2 divide-black/10 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 text-xs">
      <span className={cn(spaceMono.className, "text-black/40")}>
        {formatLabel(label)}
      </span>
      <span className="break-words font-bold">{formatValue(value)}</span>
    </div>
  );
}

export function AuditLogCard({ logs }: { logs: AuditLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <CardShell title="Audit Log" count={logs.length}>
      {logs.length === 0 && (
        <p className="p-6 text-center text-sm text-black/40">
          Belum ada aktivitas admin.
        </p>
      )}
      {logs.map((log) => {
        const isOpen = expandedId === log.id;
        const hasDetail = log.metadata && Object.keys(log.metadata).length > 0;

        return (
          <div key={log.id}>
            <button
              type="button"
              onClick={() => hasDetail && setExpandedId(isOpen ? null : log.id)}
              className={cn(
                "w-full px-4 py-3 text-left",
                hasDetail && "cursor-pointer hover:bg-black/[0.03]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold">
                  {hasDetail && (
                    <span className="mr-1 inline-block text-black/40">
                      {isOpen ? "▾" : "▸"}
                    </span>
                  )}
                  {log.description}
                </p>
                <span
                  className={cn(
                    spaceMono.className,
                    "shrink-0 text-[9px] uppercase tracking-widest text-black/40",
                  )}
                >
                  {formatDate(log.created_at)}
                </span>
              </div>
              <p
                className={cn(
                  spaceMono.className,
                  "mt-1 text-[10px] uppercase tracking-widest text-black/50",
                )}
              >
                {log.actor_email ?? "sistem"} · {log.action}
              </p>
            </button>

            {isOpen && hasDetail && (
              <div className="space-y-1.5 border-t-2 border-black/10 bg-[#FFF7DA] px-4 py-3">
                {Object.entries(log.metadata!).map(([key, value]) => (
                  <DetailRow key={key} label={key} value={value} />
                ))}
                {log.registration_id && (
                  <DetailRow
                    label="registration_id"
                    value={log.registration_id}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </CardShell>
  );
}

export function PaymentLogCard({ logs }: { logs: PaymentLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <CardShell title="Log Pembayaran / Mutasi" count={logs.length}>
      {logs.length === 0 && (
        <p className="p-6 text-center text-sm text-black/40">
          Belum ada mutasi pembayaran.
        </p>
      )}
      {logs.map((log) => {
        const isOpen = expandedId === log.id;

        return (
          <div key={log.id}>
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : log.id)}
              className="w-full cursor-pointer px-4 py-3 text-left hover:bg-black/[0.03]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className={cn(spaceMono.className, "text-xs font-bold")}>
                  <span className="mr-1 inline-block text-black/40">
                    {isOpen ? "▾" : "▸"}
                  </span>
                  {log.order_id}
                </p>
                <span
                  className={cn(
                    spaceMono.className,
                    "shrink-0 text-[9px] uppercase tracking-widest text-black/40",
                  )}
                >
                  {formatDate(log.created_at)}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "border-2 border-black px-1.5 py-0.5 text-[9px] font-bold uppercase",
                    SOURCE_COLOR[log.source] ?? "bg-white",
                  )}
                >
                  {SOURCE_LABEL[log.source] ?? log.source}
                </span>
                {log.transaction_status && (
                  <span className="text-[10px] uppercase text-black/50">
                    {log.transaction_status}
                    {log.fraud_status ? ` · ${log.fraud_status}` : ""}
                  </span>
                )}
                {log.status_applied && (
                  <span
                    className={cn(
                      "border-2 border-black px-1.5 py-0.5 text-[9px] font-bold uppercase",
                      STATUS_COLOR[log.status_applied] ?? "bg-white",
                    )}
                  >
                    → {log.status_applied}
                  </span>
                )}
              </div>

              <div className="mt-1 text-[11px] text-black/50">
                {log.payment_type && (
                  <span className="capitalize">{log.payment_type} · </span>
                )}
                {log.gross_amount != null && formatRupiah(log.gross_amount)}
              </div>
            </button>

            {isOpen && (
              <div className="space-y-1.5 border-t-2 border-black/10 bg-[#FFF7DA] px-4 py-3">
                <DetailRow
                  label="registration_id"
                  value={log.registration_id}
                />
                <DetailRow
                  label="source"
                  value={SOURCE_LABEL[log.source] ?? log.source}
                />
                <DetailRow
                  label="transaction_status"
                  value={log.transaction_status}
                />
                <DetailRow label="fraud_status" value={log.fraud_status} />
                <DetailRow label="payment_type" value={log.payment_type} />
                <DetailRow
                  label="gross_amount"
                  value={
                    log.gross_amount != null
                      ? formatRupiah(log.gross_amount)
                      : null
                  }
                />
                <DetailRow label="status_applied" value={log.status_applied} />

                {log.raw_payload && (
                  <div className="pt-1.5">
                    <p
                      className={cn(
                        spaceMono.className,
                        "mb-1 text-[10px] uppercase tracking-widest text-black/40",
                      )}
                    >
                      Payload Mentah
                    </p>
                    <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words border-2 border-black/10 bg-white p-2 text-[10px] leading-relaxed text-black/70">
                      {JSON.stringify(log.raw_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </CardShell>
  );
}

export default function LogsPanel({
  auditLogs,
  paymentLogs,
}: {
  auditLogs: AuditLog[];
  paymentLogs: PaymentLog[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AuditLogCard logs={auditLogs} />
      <PaymentLogCard logs={paymentLogs} />
    </div>
  );
}
