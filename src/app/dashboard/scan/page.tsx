"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  lookupRegistrationByScan,
  lookupRegistrationByContact,
  markRacePackTaken,
  type ScanResult,
  type ScanRegistration,
} from "@/libs/actions/admin";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";
import PageHeader from "@/components/dashboard/PageHeader";

const SCANNER_ELEMENT_ID = "acs-qr-scanner";
const SCAN_KEY_INTERVAL_THRESHOLD_MS = 50;
const MIN_SCAN_LENGTH = 3;

type HistoryEntry = {
  key: string;
  time: string;
  label: string;
  sublabel: string;
  ok: boolean;
};

function playTone(frequency: number, durationMs = 160) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + durationMs / 1000,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
    osc.onended = () => ctx.close();
  } catch {
    // ...
  }
}

function CornerBrackets({ color }: { color: string }) {
  const base = "pointer-events-none absolute h-7 w-7 sm:h-9 sm:w-9";
  return (
    <>
      <span className={cn(base, "left-3 top-3 border-l-4 border-t-4", color)} />
      <span
        className={cn(base, "right-3 top-3 border-r-4 border-t-4", color)}
      />
      <span
        className={cn(base, "bottom-3 left-3 border-b-4 border-l-4", color)}
      />
      <span
        className={cn(base, "bottom-3 right-3 border-b-4 border-r-4", color)}
      />
    </>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p
        className={cn(
          spaceMono.className,
          "text-[9px] uppercase tracking-widest text-black/40",
        )}
      >
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-bold">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-black bg-white">
      <div className={cn("border-b-2 border-black px-3 py-1.5", accent)}>
        <h3
          className={cn(
            SpecialGhotic.className,
            "text-[11px] uppercase tracking-tight",
          )}
        >
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3">{children}</div>
    </div>
  );
}

export default function ScanPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [contactMatches, setContactMatches] = useState<
    ScanRegistration[] | null
  >(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [takenJustNow, setTakenJustNow] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const lastScannedRef = useRef<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  const hidBufferRef = useRef("");
  const hidLastKeyTimeRef = useRef(0);

  function pushHistory(entry: Omit<HistoryEntry, "key" | "time">) {
    setHistory((prev) =>
      [
        {
          ...entry,
          key: `${Date.now()}-${Math.random()}`,
          time: new Intl.DateTimeFormat("id-ID", {
            timeStyle: "medium",
            timeZone: "Asia/Jakarta",
          }).format(new Date()),
        },
        ...prev,
      ].slice(0, 8),
    );
  }
  const processScannedCode = useCallback((rawCode: string) => {
    const decodedText = rawCode.trim();
    if (!decodedText) return;
    if (decodedText === lastScannedRef.current) return;

    lastScannedRef.current = decodedText;
    setTakenJustNow(false);
    setContactMatches(null);
    startTransition(async () => {
      const res = await lookupRegistrationByScan(decodedText);
      setResult(res);
      if (res.ok) {
        playTone(880);
        pushHistory({
          label: res.registration.nama_lengkap,
          sublabel: `BIB ${res.registration.bib_number ?? "-"}`,
          ok: true,
        });
      } else {
        playTone(220, 260);
        pushHistory({ label: "Scan gagal", sublabel: res.error, ok: false });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectContactMatch(reg: ScanRegistration) {
    if (reg.status !== "confirmed") {
      const errorMsg = `Peserta ditemukan, tapi status pendaftaran belum "confirmed" (status saat ini: ${reg.status}).`;
      setResult({ ok: false, error: errorMsg });
      playTone(220, 260);
      pushHistory({ label: "Cari gagal", sublabel: errorMsg, ok: false });
      return;
    }

    setResult({ ok: true, registration: reg });
    playTone(880);
    pushHistory({
      label: reg.nama_lengkap,
      sublabel: `BIB ${reg.bib_number ?? "-"}`,
      ok: true,
    });
  }
  function processManualContact(rawValue: string) {
    const value = rawValue.trim();
    if (!value) return;

    setTakenJustNow(false);
    setContactMatches(null);
    startTransition(async () => {
      const res = await lookupRegistrationByContact(value);

      if (!res.ok) {
        setResult({ ok: false, error: res.error });
        playTone(220, 260);
        pushHistory({ label: "Cari gagal", sublabel: res.error, ok: false });
        return;
      }

      if (res.registrations.length === 1) {
        setResult(null);
        selectContactMatch(res.registrations[0]);
        return;
      }
      setResult(null);
      setContactMatches(res.registrations);
    });
  }
  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            processScannedCode(decodedText);
          },
          () => {},
        );
        setScannerActive(true);
      } catch (err) {
        console.error("Gagal mengaktifkan kamera:", err);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    };
  }, [processScannedCode]);
  useEffect(() => {
    function handleHidKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      const now = performance.now();
      const delta = now - hidLastKeyTimeRef.current;
      hidLastKeyTimeRef.current = now;

      if (
        delta > SCAN_KEY_INTERVAL_THRESHOLD_MS &&
        hidBufferRef.current.length > 0
      ) {
        hidBufferRef.current = "";
      }

      if (e.key === "Enter") {
        const scanned = hidBufferRef.current.trim();
        hidBufferRef.current = "";

        if (scanned.length >= MIN_SCAN_LENGTH) {
          e.preventDefault();
          processScannedCode(scanned);
        }
        return;
      }

      if (e.key.length === 1) {
        hidBufferRef.current += e.key;
      }
    }

    window.addEventListener("keydown", handleHidKeyDown);
    return () => window.removeEventListener("keydown", handleHidKeyDown);
  }, [processScannedCode]);

  function handleScanAgain() {
    lastScannedRef.current = null;
    setResult(null);
    setContactMatches(null);
    setTakenJustNow(false);
  }

  function handleBackToMatches() {
    setResult(null);
    setTakenJustNow(false);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualValue.trim()) return;
    processManualContact(manualValue);
    setManualValue("");
  }

  function handleMarkTaken() {
    if (!result?.ok) return;
    startTransition(async () => {
      const res = await markRacePackTaken(result.registration.id);
      if (res.ok) {
        setTakenJustNow(true);
        playTone(1046, 200);
        setResult({
          ok: true,
          registration: {
            ...result.registration,
            race_pack_taken_at: res.race_pack_taken_at,
          },
        });
      }
    });
  }

  const successCount = history.filter((h) => h.ok).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Race Pack"
        title="Scan QR Peserta"
        action={
          <div
            className={cn(
              spaceMono.className,
              "flex items-center gap-2 border-2 border-black bg-[#FFD400] px-3 py-2 text-[10px] font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
            )}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
            {successCount} discan sesi ini
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden border-4 border-black bg-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div
              id={SCANNER_ELEMENT_ID}
              className="min-h-[280px] w-full [&_video]:object-cover"
            />
            <CornerBrackets
              color={result ? "border-[#7ED957]" : "border-[#FFD400]"}
            />

            <div
              className={cn(
                spaceMono.className,
                "absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest",
                scannerActive ? "" : "bg-white border-2 border-black",
              )}
            >
              {scannerActive ? null : "Camera Loading..."}
            </div>
          </div>
          <div className="mt-4 border-2 border-black bg-white">
            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              className={cn(
                spaceMono.className,
                "flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black/[0.03]",
              )}
            >
              Input Manual (Email / No. HP)
              <span className="text-black/40">{manualOpen ? "▾" : "▸"}</span>
            </button>
            {manualOpen && (
              <form
                onSubmit={handleManualSubmit}
                className="border-t-2 border-black p-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder="Email atau nomor HP peserta..."
                    autoComplete="off"
                    className="flex-1 border-2 border-black bg-white px-2.5 py-1.5 text-xs outline-none focus:bg-[#FFF7DA]"
                  />
                  <button
                    type="submit"
                    className="shrink-0 border-2 border-black bg-[#FFD400] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:-translate-y-0.5"
                  >
                    Cari
                  </button>
                </div>
                <p
                  className={cn(
                    spaceMono.className,
                    "mt-2 text-[9px] uppercase tracking-widest text-black/40",
                  )}
                >
                  cth: nama@email.com atau 0812xxxxxxx — kalau hasilnya lebih
                  dari 1 data, kamu bisa pilih salah satu di panel kanan.
                </p>
              </form>
            )}
          </div>

          {history.length > 0 && (
            <div className="mt-4 border-2 border-black bg-white">
              <div className="flex items-center justify-between border-b-2 border-black bg-black px-3 py-1.5">
                <h3
                  className={cn(
                    SpecialGhotic.className,
                    "text-[11px] uppercase tracking-tight text-white",
                  )}
                >
                  Riwayat Sesi Ini
                </h3>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className={cn(
                    spaceMono.className,
                    "text-[9px] uppercase tracking-widest text-white/50 hover:text-white",
                  )}
                >
                  Bersihkan
                </button>
              </div>
              <div className="max-h-52 divide-y-2 divide-black/10 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.key}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center border-2 border-black text-[10px] font-bold",
                        h.ok ? "bg-[#7ED957]" : "bg-[#D91E36] text-white",
                      )}
                    >
                      {h.ok ? "✓" : "✕"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{h.label}</p>
                      <p className="truncate text-[10px] text-black/40">
                        {h.sublabel}
                      </p>
                    </div>
                    <span
                      className={cn(
                        spaceMono.className,
                        "shrink-0 text-[9px] text-black/30",
                      )}
                    >
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {isPending && (
            <div className="animate-pulse border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="mx-auto h-16 w-40 bg-black/10" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full bg-black/10" />
                <div className="h-3 w-3/4 bg-black/10" />
                <div className="h-3 w-5/6 bg-black/10" />
              </div>
            </div>
          )}

          {!result && !contactMatches && !isPending && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center border-4 border-dashed border-black/20 p-8 text-center">
              <span className="mb-3 text-4xl">🎫</span>
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-base uppercase tracking-tight text-black/50",
                )}
              >
                Menunggu Scan
              </p>
              <p className="mt-1 max-w-xs text-xs text-black/40">
                Hasil data peserta akan muncul di sini.
              </p>
            </div>
          )}

          {contactMatches && !result && !isPending && (
            <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p
                className={cn(
                  SpecialGhotic.className,
                  "text-sm uppercase tracking-tight",
                )}
              >
                Ditemukan {contactMatches.length} data yang cocok
              </p>
              <p className="mt-1 text-xs text-black/50">
                Email/nomor HP ini dipakai lebih dari sekali daftar. Pilih data
                yang sesuai di bawah.
              </p>

              <div className="mt-4 space-y-2">
                {contactMatches.map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => selectContactMatch(reg)}
                    className="flex w-full items-center justify-between gap-3 border-2 border-black bg-white px-3 py-2.5 text-left transition-colors hover:bg-[#FFF7DA]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {reg.nama_lengkap}
                      </p>
                      <p
                        className={cn(
                          spaceMono.className,
                          "mt-0.5 truncate text-[10px] uppercase tracking-widest text-black/40",
                        )}
                      >
                        {reg.email} · {reg.telepon} ·{" "}
                        <span className="capitalize">{reg.kategori}</span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        spaceMono.className,
                        "shrink-0 border-2 border-black px-2 py-1 text-[9px] font-bold uppercase tracking-widest",
                        reg.status === "confirmed"
                          ? "bg-[#7ED957]"
                          : "bg-black/10",
                      )}
                    >
                      {reg.bib_number ? `BIB ${reg.bib_number}` : reg.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {result && !isPending && (
            <div>
              {result.ok ? (
                <div
                  className={cn(
                    "border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-colors sm:p-6",
                    takenJustNow && "bg-[#F3FBEF]",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="-rotate-2 border-2 border-black bg-[#FFD400] px-4 py-2.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <p
                        className={cn(
                          spaceMono.className,
                          "text-[9px] uppercase tracking-widest",
                        )}
                      >
                        Nomor BIB
                      </p>
                      <p className={cn(SpecialGhotic.className, "text-3xl")}>
                        {result.registration.bib_number ?? "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          SpecialGhotic.className,
                          "text-lg uppercase leading-tight tracking-tight",
                        )}
                      >
                        {result.registration.nama_lengkap}
                      </p>
                      <p
                        className={cn(
                          spaceMono.className,
                          "text-[10px] uppercase tracking-widest text-black/40",
                        )}
                      >
                        Nama di BIB: {result.registration.nama_bib}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <DetailSection title="Identitas" accent="bg-[#FFD400]">
                      <DetailField
                        label="Kategori"
                        value={
                          <span className="capitalize">
                            {result.registration.kategori}
                          </span>
                        }
                      />
                      <DetailField
                        label="Jenis Kelamin"
                        value={
                          result.registration.jenis_kelamin === "L"
                            ? "Laki-laki"
                            : "Perempuan"
                        }
                      />
                      <DetailField
                        label="Golongan Darah"
                        value={result.registration.golongan_darah || "-"}
                      />
                      <DetailField
                        label="Ukuran Jersey"
                        value={result.registration.ukuran_jersey}
                      />
                      {result.registration.kategori === "pelajar" ? (
                        <DetailField
                          label="NISN"
                          value={result.registration.nisn ?? "-"}
                        />
                      ) : (
                        <DetailField
                          label="NIK"
                          value={result.registration.nik_terakhir ?? "-"}
                        />
                      )}
                    </DetailSection>

                    <DetailSection title="Kontak" accent="bg-[#7ED957]">
                      <DetailField
                        label="Email"
                        value={
                          <span className="break-all">
                            {result.registration.email}
                          </span>
                        }
                      />
                      <DetailField
                        label="Telepon"
                        value={result.registration.telepon}
                      />
                    </DetailSection>

                    <DetailSection
                      title="Kontak Darurat"
                      accent="bg-[#3B82F6] [&_h3]:text-white"
                    >
                      <DetailField
                        label="Nama"
                        value={result.registration.kontak_darurat_nama}
                      />
                      <DetailField
                        label="Telepon"
                        value={result.registration.kontak_darurat_telepon}
                      />
                    </DetailSection>

                    {result.registration.riwayat_penyakit && (
                      <DetailSection
                        title="⚠ Riwayat Penyakit"
                        accent="bg-[#D91E36] [&_h3]:text-white"
                      >
                        <div className="col-span-2">
                          <p className="text-sm font-bold">
                            {result.registration.riwayat_penyakit}
                          </p>
                        </div>
                      </DetailSection>
                    )}
                  </div>

                  <div className="mt-5 border-t-2 border-black/10 pt-4">
                    {result.registration.race_pack_taken_at ? (
                      <p className="flex items-center gap-2 border-2 border-[#1F4B33] bg-[#1F4B33]/10 px-3 py-2.5 text-xs font-bold text-[#1F4B33]">
                        <span className="text-base">✅</span>
                        {takenJustNow
                          ? "Berhasil ditandai sudah diambil."
                          : "Race pack sudah pernah diambil sebelumnya."}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkTaken}
                        className="w-full border-4 border-black bg-[#7ED957] px-4 py-3 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Tandai Race Pack Sudah Diambil
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-4 border-[#D91E36] bg-white p-6 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-4xl">✕</span>
                  <p
                    className={cn(
                      SpecialGhotic.className,
                      "mt-2 text-base uppercase tracking-tight text-[#D91E36]",
                    )}
                  >
                    Scan Gagal
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#D91E36]">
                    {result.error}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {contactMatches && contactMatches.length > 1 && (
                  <button
                    type="button"
                    onClick={handleBackToMatches}
                    className="w-full border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white sm:w-auto"
                  >
                    ← Kembali ke Daftar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="w-full border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white sm:w-auto"
                >
                  Scan Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
