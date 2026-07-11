"use client";

import { TextareaHTMLAttributes } from "react";
import { cn } from "@/libs/cn";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
};

export default function TextAreaField({
  label,
  name,
  error,
  optional,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={name}
        className={cn(
          SpecialGhotic.className,
          "text-sm uppercase tracking-tight text-black",
        )}
      >
        {label}
        {optional && (
          <span
            className={cn(
              spaceMono.className,
              "ml-2 text-xs normal-case tracking-normal text-black/40",
            )}
          >
            (opsional)
          </span>
        )}
      </label>

      <textarea
        id={name}
        name={name}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
        className={cn(
          "border-4 bg-white px-4 py-3 text-base text-black placeholder:text-black/40",
          "transition-all duration-150 focus:outline-none! focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          error ? "border-[#D91E36]" : "border-black focus:border-[#FF5A1F]",
          className,
        )}
      />

      {error && (
        <p
          id={`${name}-error`}
          className={cn(spaceMono.className, "text-xs text-[#D91E36]")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
