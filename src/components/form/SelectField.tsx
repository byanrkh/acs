"use client";

import { SelectHTMLAttributes } from "react";
import { cn } from "@/libs/cn";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

type Option = { value: string; label: string };

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: Option[];
  placeholder?: string;
  error?: string;
  hideLabel?: boolean;
};

export default function SelectField({
  label,
  name,
  options,
  placeholder = "Pilih salah satu",
  error,
  hideLabel,
  className,
  ...props
}: SelectFieldProps) {
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

      <div className="relative">
        <select
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
          className={cn(
            "w-full appearance-none border-4 bg-white px-4 py-3 pr-10 text-base text-black",
            "transition-all duration-150 focus:outline-none! focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            error ? "border-[#D91E36]" : "border-black focus:border-[#FF5A1F]",
            className,
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
        >
          <path
            d="M3 6l5 5 5-5"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

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
