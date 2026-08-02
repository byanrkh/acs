"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { cn } from "@/libs/cn";

const COLLAPSE_KEY = "acs-admin-sidebar-collapsed";

export default function DashboardShell({
  userEmail,
  initialParticipantCount,
  initialPendingTransferCount,
  children,
}: {
  userEmail: string;
  initialParticipantCount: number;
  initialPendingTransferCount: number;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Baca preferensi collapse dari localStorage sekali pas mount, supaya
  // admin ga harus collapse ulang tiap ganti halaman.
  useEffect(() => {
    const saved = window.localStorage.getItem(COLLAPSE_KEY);
    if (saved === "1") setCollapsed(true);
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#FDF6E9]">
      <Sidebar
        userEmail={userEmail}
        initialParticipantCount={initialParticipantCount}
        initialPendingTransferCount={initialPendingTransferCount}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      <main
        className={cn(
          "px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
          hydrated &&
            "transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          collapsed ? "lg:ml-20" : "lg:ml-72",
        )}
      >
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
