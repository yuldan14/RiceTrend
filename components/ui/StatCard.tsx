import type { ReactNode } from "react";
import { CardSkeleton } from "./Skeleton";
import { Badge, type BadgeVariant } from "./Badge";
import { cn } from "@/utils/style";

export interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  trend?: string;
  trendVariant?: BadgeVariant;
  sparkline?: ReactNode;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  trend,
  trendVariant = "neutral",
  sparkline,
  loading = false,
}: StatCardProps) {
  if (loading) return <CardSkeleton />;

  return (
    <article className="group min-w-0 rounded-card border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-500">
            {icon}
          </div>
          <p className="min-w-0 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        </div>
        <div className={cn("hidden w-14 shrink-0 sm:block", !sparkline && "opacity-0")}>
          {sparkline}
        </div>
      </div>
      <p className="mt-3 whitespace-nowrap text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {trend && <Badge variant={trendVariant}>{trend}</Badge>}
        <span className="text-xs text-muted">{detail}</span>
      </div>
    </article>
  );
}

export default StatCard;
