"use client";

import { useState } from "react";
import AccountSettingsCard from "@/components/dashboard/AccountSettingsCard";
import SystemInfoCard from "@/components/dashboard/SystemInfoCard";
import PaymentMethodSettingsCard from "@/components/dashboard/PaymentMethodSettingsCard";
import LogsPanel from "@/components/dashboard/LogsPanel";
import type { AuditLog, PaymentLog } from "@/libs/actions/logs";
import type { PaymentMethodAdminRow } from "@/libs/actions/paymentSettings";
import { spaceMono, SpecialGhotic } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Tab = "akun" | "pembayaran" | "sistem" | "aktivitas";

const TABS: { id: Tab; label: string }[] = [
  { id: "akun", label: "Akun" },
  { id: "pembayaran", label: "Metode Bayar" },
  { id: "sistem", label: "Info Sistem" },
  { id: "aktivitas", label: "Log Aktivitas" },
];

export default function SettingsView({
  userEmail,
  fees,
  contact,
  bankTransfer,
  paymentMethodSettings,
  auditLogs,
  paymentLogs,
}: {
  userEmail: string;
  fees: { pelajar: number; umum: number };
  contact: {
    email: string;
    whatsapp: string;
    instagram: string;
    address: string;
  };
  bankTransfer: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  paymentMethodSettings: PaymentMethodAdminRow[];
  auditLogs: AuditLog[];
  paymentLogs: PaymentLog[];
}) {
  const [tab, setTab] = useState<Tab>("akun");

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-4 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              SpecialGhotic.className,
              "border-2 px-4 py-2 text-xs uppercase tracking-tight transition-colors",
              tab === t.id
                ? "border-black bg-[#A78BFA] text-black"
                : "border-transparent text-black/50 hover:border-black hover:text-black",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "akun" && <AccountSettingsCard userEmail={userEmail} />}

        {tab === "pembayaran" && (
          <PaymentMethodSettingsCard initialRows={paymentMethodSettings} />
        )}

        {tab === "sistem" && (
          <SystemInfoCard
            fees={fees}
            contact={contact}
            bankTransfer={bankTransfer}
          />
        )}

        {tab === "aktivitas" && (
          <div>
            <p
              className={cn(
                spaceMono.className,
                "mb-4 text-[11px] uppercase tracking-widest text-black/40",
              )}
            >
              50 aktivitas & mutasi pembayaran terakhir
            </p>
            <LogsPanel auditLogs={auditLogs} paymentLogs={paymentLogs} />
          </div>
        )}
      </div>
    </div>
  );
}
