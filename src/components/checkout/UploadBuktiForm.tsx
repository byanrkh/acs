"use client";

import { ChangeEvent, FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { uploadBuktiTransfer } from "@/libs/actions/qrisUpload";
import { spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

export default function UploadBuktiForm({
  registrationId,
}: {
  registrationId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) {
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Pilih file bukti transfer dulu.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadBuktiTransfer(registrationId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/checkout/qris/${registrationId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-widest text-black/70">
          Screenshot / foto bukti transfer
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className={cn(
            spaceMono.className,
            "mt-2 block w-full border-4 border-black bg-[#FDF6E9] p-3 text-xs file:mr-3 file:border-4 file:border-black file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold",
          )}
        />
      </label>

      {preview && (
        <div className="border-4 border-black p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview bukti transfer"
            className="mx-auto max-h-64 w-auto"
          />
        </div>
      )}

      {error && (
        <p className={cn(spaceMono.className, "text-xs text-[#D91E36]")}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full justify-center text-[#004D3D]"
        disabled={isPending}
      >
        {isPending ? "Mengunggah..." : "Kirim bukti transfer"}
      </Button>
    </form>
  );
}
