"use client";

import { ChangeEvent, FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { uploadBuktiTransfer } from "@/libs/actions/transferUpload";
import { spaceMono } from "@/libs/Font";
import { cn } from "@/libs/cn";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.72;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedName =
            file.name.replace(/\.(png|webp|jpeg)$/i, "") + ".jpg";
          resolve(
            new File([blob], compressedName || "bukti-transfer.jpg", {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadBuktiForm({
  registrationId,
}: {
  registrationId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const compressedFileRef = useRef<File | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    setCompressInfo(null);
    compressedFileRef.current = null;

    if (!file) {
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setIsCompressing(true);

    try {
      const compressed = await compressImage(file);
      compressedFileRef.current = compressed;
      setCompressInfo(
        `Ukuran asli ${formatFileSize(file.size)} → dikompres jadi ${formatFileSize(
          compressed.size,
        )}`,
      );
    } catch (err) {
      console.error("[UploadBuktiForm] gagal kompres gambar:", err);
      compressedFileRef.current = file;
    } finally {
      setIsCompressing(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const originalFile = inputRef.current?.files?.[0];
    if (!originalFile) {
      setError("Pilih file bukti transfer dulu.");
      return;
    }

    const fileToUpload = compressedFileRef.current ?? originalFile;

    const formData = new FormData();
    formData.set("file", fileToUpload);

    startTransition(async () => {
      const result = await uploadBuktiTransfer(registrationId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/checkout/transfer/${registrationId}`);
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

      {isCompressing && (
        <p className={cn(spaceMono.className, "text-xs text-black/50")}>
          Mengompres gambar...
        </p>
      )}

      {!isCompressing && compressInfo && (
        <p className={cn(spaceMono.className, "text-xs text-black/50")}>
          {compressInfo}
        </p>
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
        disabled={isPending || isCompressing}
      >
        {isPending
          ? "Mengunggah..."
          : isCompressing
            ? "Menyiapkan gambar..."
            : "Kirim bukti transfer"}
      </Button>
    </form>
  );
}
