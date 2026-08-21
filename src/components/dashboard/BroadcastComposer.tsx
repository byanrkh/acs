"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { sendBroadcast, sendTestBroadcast } from "@/libs/actions/broadcast";
import FormField from "@/components/form/FormField";
import TextAreaField from "@/components/form/TextAreaField";
import Button from "@/components/Button";
import { SpecialGhotic, spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

type Feedback = { type: "success" | "error"; text: string } | null;
type Mode = "test" | "asli";

export default function BroadcastComposer({
  recipientCount,
  testEmails,
}: {
  recipientCount: number;
  testEmails: string[];
}) {
  const [mode, setMode] = useState<Mode>("test");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmingBroadcast, setConfirmingBroadcast] = useState(false);

  const canCompose = subject.trim().length > 0 && message.trim().length > 0;

  function handleModeChange(e: ChangeEvent<HTMLSelectElement>) {
    setMode(e.target.value as Mode);
    setFeedback(null);
    setConfirmingBroadcast(false);
  }

  function handleSubjectChange(e: ChangeEvent<HTMLInputElement>) {
    setSubject(e.target.value);
  }

  function handleMessageChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
  }

  function handleSend() {
    setFeedback(null);

    if (!canCompose) {
      setFeedback({ type: "error", text: "Isi subjek dan pesan dulu." });
      return;
    }

    // Broadcast asli butuh klik 2x buat konfirmasi (aksi ini nggak bisa
    // dibatalin setelah dikirim). Mode test langsung jalan, boleh dipencet
    // berkali-kali tanpa konfirmasi.
    if (mode === "asli" && !confirmingBroadcast) {
      setConfirmingBroadcast(true);
      return;
    }

    startTransition(async () => {
      const result =
        mode === "test"
          ? await sendTestBroadcast({ subject, message })
          : await sendBroadcast({ subject, message });

      setConfirmingBroadcast(false);

      if (!result.ok) {
        setFeedback({ type: "error", text: result.error });
        return;
      }

      if (mode === "test") {
        setFeedback({
          type: "success",
          text: `Test broadcast terkirim ke ${result.sent} email${
            result.failed > 0 ? ` (${result.failed} gagal)` : ""
          }. Cek inbox test-nya, lalu edit lagi kalau perlu.`,
        });
      } else {
        setFeedback({
          type: "success",
          text: `Broadcast terkirim ke ${result.sent} peserta${
            result.failed > 0 ? ` (${result.failed} gagal)` : ""
          }.`,
        });
        setSubject("");
        setMessage("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black pb-4">
          <h2
            className={cn(
              SpecialGhotic.className,
              "text-lg uppercase tracking-tight sm:text-xl",
            )}
          >
            Tulis Broadcast
          </h2>
          <span
            className={cn(
              spaceMono.className,
              "border-2 border-black bg-[#7ED957] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
            )}
          >
            {recipientCount} peserta confirmed
          </span>
        </div>

        <div className="mt-5 space-y-5">
          <FormField
            label="Subject"
            name="subject"
            type="text"
            placeholder="Contoh: Update Penting Race Day ACS 2026"
            value={subject}
            onChange={handleSubjectChange}
            maxLength={150}
            hint={`${subject.length}/150 karakter`}
          />

          <TextAreaField
            label="Isi Pesan"
            name="message"
            placeholder={"Halo peserta ACS 2026!"}
            value={message}
            onChange={handleMessageChange}
            rows={10}
          />
        </div>
      </div>

      <div
        className={cn(
          "border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-6",
          mode === "test" ? "bg-[#FFF7DA]" : "bg-white",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="broadcast-mode"
              className={cn(
                SpecialGhotic.className,
                "text-sm uppercase tracking-tight text-black",
              )}
            >
              Mode Kirim
            </label>
            <select
              id="broadcast-mode"
              value={mode}
              onChange={handleModeChange}
              className={cn(
                spaceMono.className,
                "border-4 border-black bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest",
              )}
            >
              <option value="test">🧪 Test Broadcast</option>
              <option value="asli">📣 Broadcast Asli</option>
            </select>
          </div>

          {mode === "test" ? (
            <div className="flex-1">
              <p
                className={cn(
                  spaceMono.className,
                  "text-[10px] uppercase tracking-widest text-black/40",
                )}
              >
                Terkirim ke {testEmails.length} email test (dari config)
              </p>
              <p className="mt-1 text-xs text-black/70">
                {testEmails.join(", ")}
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <p
                className={cn(
                  spaceMono.className,
                  "text-[10px] uppercase tracking-widest text-black/40",
                )}
              >
                Peringatan
              </p>
              <p className="mt-1 text-xs text-black/70">
                Akan terkirim ke <strong>{recipientCount} peserta</strong>{" "}
                berstatus confirmed. Tidak bisa dibatalkan setelah dikirim.
              </p>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={cn(
              "mt-5 border-4 px-4 py-3",
              feedback.type === "success"
                ? "border-[#1F4B33] bg-[#7ED957]/30"
                : "border-[#D91E36] bg-[#D91E36]/10",
            )}
          >
            <p
              className={cn(
                spaceMono.className,
                "text-xs font-bold",
                feedback.type === "success"
                  ? "text-[#1F4B33]"
                  : "text-[#D91E36]",
              )}
            >
              {feedback.text}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={mode === "test" ? "dark" : "primary"}
            onClick={handleSend}
            disabled={
              !canCompose ||
              isPending ||
              (recipientCount === 0 && mode === "asli")
            }
            className={confirmingBroadcast ? "bg-[#D91E36]! text-white" : ""}
          >
            {isPending
              ? "Mengirim..."
              : mode === "test"
                ? "Kirim Test Broadcast"
                : confirmingBroadcast
                  ? `Yakin? Klik lagi untuk kirim ke ${recipientCount} peserta`
                  : "Kirim Broadcast ke Semua Peserta"}
          </Button>
          {mode === "asli" && confirmingBroadcast && !isPending && (
            <button
              type="button"
              onClick={() => setConfirmingBroadcast(false)}
              className={cn(
                spaceMono.className,
                "text-xs font-bold uppercase tracking-widest text-black/50 underline hover:text-black",
              )}
            >
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
