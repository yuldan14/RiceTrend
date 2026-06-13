import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/style";

export type BadgeVariant = "up" | "down" | "neutral" | "model" | "warning" | "status";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  up: "border-emerald-200 bg-emerald-50 text-emerald-700",
  down: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-border bg-slate-100 text-slate-700",
  model: "border-brand-100 bg-brand-100 text-brand-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  status: "border-brand-100 bg-brand-50 text-brand-700",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold leading-none",
        variantClass[variant],
        className,
      )}
    >
      {variant === "up" && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
      {variant === "down" && <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
      {variant === "neutral" && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
      {variant === "warning" && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
