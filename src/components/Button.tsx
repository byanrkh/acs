import Link from "next/link";
import { cn } from "@/libs/cn";
import type { MouseEventHandler, ReactNode } from "react";
import { SpecialGhotic } from "@/libs/Font";

type Variant = "primary" | "secondary" | "dark";
type Size = "sm" | "md";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler;
  variant?: Variant;
  size?: Size;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Set true for links that go outside the site (e.g. Google Drive) — opens in a new tab. */
  external?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-[#FF5A1F] text-black",
  secondary: "bg-white text-black",
  dark: "bg-black text-[#FDF6E9]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
};

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled = false,
  external = false,
}: ButtonProps) {
  const classes = cn(
    SpecialGhotic.className,
    "inline-flex items-center justify-center gap-2 border-4 border-black uppercase tracking-tight",
    "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-150",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
    "active:translate-x-0 active:translate-y-0 active:shadow-none",
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href && external) {
    return (
      <a
        href={href}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
