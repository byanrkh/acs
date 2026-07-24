"use client";

import { useState } from "react";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { cn } from "@/libs/cn";

type CopyButtonProps = {
  /** Teks yang bakal disalin ke clipboard */
  value: string;
  className?: string;
  /** Label buat screen reader, default "Salin" */
  label?: string;
};

export default function CopyButton({
  value,
  className,
  label = "Salin",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback buat browser lama / konteks non-secure yang gak support
      // navigator.clipboard (mis. http:// bukan https://).
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (fallbackError) {
        console.error("[CopyButton] gagal menyalin teks:", fallbackError);
      }
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={cn(
        "flex gap-2 cursor-pointer items-center text-2xl tracking-widest text-black break-all bg-gray-200 border-2 border-gray-300 px-2 py-0.5 rounded",
        // "inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-white text-sm text-black transition-transform hover:-translate-y-0.5 active:translate-y-0",
        copied && "bg-gray-200/70",
        className,
      )}
    >
      {value}
      {copied ? <FaCheck size={15} /> : <FaRegCopy size={15} />}
    </button>
  );
}
