import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-md)] border bg-white px-3 py-2.5 text-sm text-[var(--foreground)] shadow-sm transition-colors placeholder:text-[var(--muted)]",
        invalid
          ? "border-[var(--danger)] focus:border-[var(--danger)]"
          : "border-[var(--card-border)] focus:border-[var(--accent)]",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});
