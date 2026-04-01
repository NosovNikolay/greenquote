import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-white text-[var(--primary)] border border-[var(--card-border)] shadow-sm hover:bg-[var(--accent-soft)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white",
  ghost: "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)]",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
