"use client";

import { cn } from "@/libs/cn";
import { SpecialGhotic, spaceMono } from "@/libs/Font";

type Option = { value: string; label: string };

type RadioTabsProps = {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  error?: string;
};

export default function RadioTabs({
  legend,
  name,
  value,
  onChange,
  options,
  error,
}: RadioTabsProps) {
  return (
    <fieldset id={name}>
      <legend
        className={cn(
          SpecialGhotic.className,
          "text-sm uppercase tracking-tight text-black",
        )}
      >
        {legend}
      </legend>

      <div className="mt-2 flex flex-wrap gap-3">
        {options.map((opt) => {
          const checked = value === opt.value;
          return (
            <label key={opt.value} className="flex-1">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  SpecialGhotic.className,
                  "block cursor-pointer border-4 px-5 py-3 text-center uppercase tracking-tight transition-all duration-150",
                  checked
                    ? "-translate-x-0.5 -translate-y-0.5 border-black bg-[#FF5A1F] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : "border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FDF6E9]",
                )}
              >
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p className={cn(spaceMono.className, "mt-2 text-xs text-[#D91E36]")}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
