"use client";

import { InputHTMLAttributes } from "react";
import { cn } from "@/libs/cn";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
};

export default function FormField({
  label,
  name,
  error,
  hint,
  hideLabel,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {!hideLabel && (
        <label
          htmlFor={name}
          className={cn(
            SpecialGhotic.className,
            "text-sm uppercase tracking-tight text-black",
          )}
        >
          {label}
        </label>
      )}

      <input
        id={name}
        name={name}
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

      <div className="flex items-center justify-between">
        {error ? (
          <p
            id={`${name}-error`}
            className={cn(spaceMono.className, "text-xs text-[#D91E36]")}
          >
            {error}
          </p>
        ) : (
          <span />
        )}
        {hint && (
          <p className={cn(spaceMono.className, "text-xs text-black/40")}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
