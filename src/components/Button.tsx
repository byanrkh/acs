import Link from "next/link";
import { cn } from "@/libs/cn";
import type { MouseEventHandler, ReactNode } from "react";

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
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-ember text-ink",
  secondary: "bg-white text-ink",
  dark: "bg-ink text-sand",
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
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 border-4 border-ink font-display uppercase tracking-tight",
    "shadow-brutal-sm transition-transform duration-150",
    "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal",
    "active:translate-x-0 active:translate-y-0 active:shadow-none",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
