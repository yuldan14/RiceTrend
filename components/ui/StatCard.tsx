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
    <article className="group rounded-card border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-500">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 truncate font-mono text-2xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
        <div className={cn("hidden w-[72px] shrink-0 sm:block", !sparkline && "opacity-0")}>
          {sparkline}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {trend && <Badge variant={trendVariant}>{trend}</Badge>}
        <span className="text-xs text-muted">{detail}</span>
      </div>
    </article>
  );
}

export default StatCard;
