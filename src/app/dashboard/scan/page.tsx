"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  lookupRegistrationByScan,
  markRacePackTaken,
  type ScanResult,
} from "@/libs/actions/admin";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";
import PageHeader from "@/components/dashboard/PageHeader";

const SCANNER_ELEMENT_ID = "acs-qr-scanner";

// --- Konfigurasi HID Barcode Scanner (mis. HC-P10) ---
// Scanner fisik mengetik karakter dengan jeda sangat pendek (biasanya <10ms
// antar karakter). Kalau jeda antar-keystroke melebihi ambang ini, buffer
// dianggap bukan bagian dari satu scan yang sama dan direset.
const SCAN_KEY_INTERVAL_THRESHOLD_MS = 50;
// Panjang minimum supaya Enter "nyasar" (mis. dari tombol lain) tidak
// dianggap hasil scan valid.
const MIN_SCAN_LENGTH = 3;

export default function ScanPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [takenJustNow, setTakenJustNow] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  // --- State buffer untuk HID scanner (bukan useState agar tidak re-render
  // tiap keystroke; HID scanner bisa kirim puluhan keydown per detik) ---
  const hidBufferRef = useRef("");
  const hidLastKeyTimeRef = useRef(0);

  // Jalur validasi bersama: dipakai baik oleh kamera (html5-qrcode) maupun
  // oleh HID barcode scanner, supaya keduanya konsisten dan tidak dobel logic.
  const processScannedCode = useCallback((rawCode: string) => {
    const decodedText = rawCode.trim();
    if (!decodedText) return;
    if (decodedText === lastScannedRef.current) return;

    lastScannedRef.current = decodedText;
    setTakenJustNow(false);
    startTransition(async () => {
      const res = await lookupRegistrationByScan(decodedText);
      setResult(res);
    });
  }, []);

  // --- Kamera / webcam (html5-qrcode) — TIDAK diubah selain memanggil
  // processScannedCode() sebagai pengganti logic inline sebelumnya ---
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
          () => {
            // diabaikan — dipanggil terus tiap frame walau QR belum kedeteksi
          },
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

  // --- HID Barcode Scanner (mis. HC-P10) via USB Keyboard Emulation ---
  // Listener global di background: tidak butuh fokus/klik elemen apa pun.
  useEffect(() => {
    function handleHidKeyDown(e: KeyboardEvent) {
      // Jangan ganggu kalau fokus sedang di elemen form aktif (input/textarea/
      // select/contentEditable) — jaga-jaga kalau halaman ini nanti punya
      // field pencarian manual.
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

      // Jeda kelamaan sebelum karakter ini -> bukan bagian dari scan yang
      // sedang berjalan (kemungkinan ketikan manual panitia). Reset buffer.
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

      // Hanya tampung karakter cetak tunggal (huruf/angka/simbol dari
      // scanner). Tombol non-karakter (Shift, Ctrl, Alt, dll) diabaikan.
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
    setTakenJustNow(false);
  }

  function handleMarkTaken() {
    if (!result?.ok) return;
    startTransition(async () => {
      const res = await markRacePackTaken(result.registration.id);
      if (res.ok) {
        setTakenJustNow(true);
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader eyebrow="Race Pack" title="Scan QR Peserta" />

      <div className="mx-auto max-w-md">
        {isPending && (
          <p
            className={cn(
              spaceMono.className,
              "mb-4 text-xs uppercase tracking-widest text-black/50",
            )}
          >
            Mencari data peserta...
          </p>
        )}

        {result && !isPending && (
          <div className="mb-6">
            {result.ok ? (
              <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-2 border-black bg-[#FFD400] px-3 py-2 text-center">
                  <p
                    className={cn(
                      spaceMono.className,
                      "text-[10px] uppercase tracking-widest",
                    )}
                  >
                    Nomor BIB
                  </p>
                  <p className={cn(SpecialGhotic.className, "text-3xl")}>
                    {result.registration.bib_number ?? "-"}
                  </p>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Nama" value={result.registration.nama_lengkap} />
                  <Row
                    label="Nama di BIB"
                    value={result.registration.nama_bib}
                  />
                  <Row label="Kategori" value={result.registration.kategori} />
                  {result.registration.kategori === "pelajar" ? (
                    <Row label="NISN" value={result.registration.nisn ?? "-"} />
                  ) : (
                    <Row
                      label="NIK (4 digit akhir)"
                      value={result.registration.nik_terakhir ?? "-"}
                    />
                  )}
                  <Row
                    label="Ukuran Jersey"
                    value={result.registration.ukuran_jersey}
                  />
                  <Row
                    label="Jenis Kelamin"
                    value={result.registration.jenis_kelamin}
                  />
                  <Row
                    label="Golongan Darah"
                    value={result.registration.golongan_darah}
                  />
                  <Row label="Telepon" value={result.registration.telepon} />
                  <Row
                    label="Kontak Darurat"
                    value={`${result.registration.kontak_darurat_nama} (${result.registration.kontak_darurat_telepon})`}
                  />
                  {result.registration.riwayat_penyakit && (
                    <Row
                      label="Riwayat Penyakit"
                      value={result.registration.riwayat_penyakit}
                    />
                  )}
                </dl>

                <div className="mt-4 border-t-2 border-black/10 pt-4">
                  {result.registration.race_pack_taken_at ? (
                    <p className="border-2 border-[#1F4B33] bg-[#1F4B33]/10 px-3 py-2 text-xs font-bold text-[#1F4B33]">
                      {takenJustNow
                        ? "Berhasil ditandai sudah diambil."
                        : "Race pack sudah pernah diambil sebelumnya."}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleMarkTaken}
                      className="w-full border-4 border-black bg-[#7ED957] px-4 py-2.5 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Tandai race pack sudah diambil
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="border-4 border-[#D91E36] bg-[#D91E36]/10 p-4 text-sm font-bold text-[#D91E36]">
                {result.error}
              </p>
            )}

            <button
              type="button"
              onClick={handleScanAgain}
              className="mt-4 w-full border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white sm:w-auto"
            >
              Scan berikutnya
            </button>
          </div>
        )}

        <div>
          <div
            id={SCANNER_ELEMENT_ID}
            className="min-h-[280px] overflow-hidden border-4 border-black bg-black"
          />
          {!scannerActive && (
            <p className="mt-2 text-xs text-black/50">
              Mengaktifkan kamera... pastikan browser diizinkan mengakses
              kamera.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-black/10 pb-2">
      <dt className="shrink-0 text-black/50">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
