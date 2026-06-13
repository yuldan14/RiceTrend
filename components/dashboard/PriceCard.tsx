"use client";

import CountUp from "react-countup";
import { Clock3, TriangleAlert, Wheat } from "lucide-react";
import { PriceAreaChart } from "@/components/charts/PriceAreaChart";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, getRiceLabel, type SelectedRiceCategory } from "@/utils/api";
import { formatPercent, type ChartPoint } from "@/utils/dashboard";

export interface PriceCardProps {
  rice: SelectedRiceCategory;
  price: number | null;
  change: number | null;
  history: ChartPoint[];
  lastUpdated: string | null;
  loading: boolean;
  alertThreshold: number;
}

export function PriceCard({
  rice,
  price,
  change,
  history,
  lastUpdated,
  loading,
  alertThreshold,
}: PriceCardProps) {
  if (loading) {
    return (
      <article className="rounded-card border border-border bg-white p-6 shadow-card" aria-busy="true">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-8 h-12 w-56" />
        <Skeleton className="mt-6 h-44 w-full" />
      </article>
    );
  }

  if (!rice || price === null) {
    return (
      <article className="rounded-card border border-border bg-white p-6 shadow-card">
        <EmptyState
          icon={<Wheat className="h-8 w-8" aria-hidden="true" />}
          title="Pilih jenis beras untuk melihat harga"
          description="Gunakan dropdown di atas untuk memulai."
          arrow
        />
      </article>
    );
  }

  const significant = change !== null && Math.abs(change) > alertThreshold;
  const trendVariant = change === null ? "neutral" : change >= 0 ? "up" : "down";

  return (
    <article className="rounded-card border border-border bg-white p-6 shadow-card transition hover:shadow-card-hover">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <Wheat className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Harga Saat Ini</h2>
              <p className="text-xs text-muted">{getRiceLabel(rice)}</p>
            </div>
          </div>
        </div>
        <Badge variant="status">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {lastUpdated ?? "Belum diperbarui"}
        </Badge>
      </div>

      <div className="mt-7 flex flex-wrap items-end gap-3">
        <p className="font-mono text-4xl font-black text-slate-900">
          <span className="mr-2 text-2xl font-bold">Rp</span>
          <CountUp end={Math.round(price)} duration={0.6} separator="." />
        </p>
        <span className="pb-1 text-sm text-muted">/kg</span>
        <Badge variant={trendVariant}>{formatPercent(change)} hari ini</Badge>
      </div>

      {significant && (
        <div className="mt-4">
          <Badge variant="warning" className="animate-pulse">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Perubahan signifikan
          </Badge>
        </div>
      )}

      <div className="mt-4">
        <PriceAreaChart data={history} />
      </div>
      <p className="mt-4 border-t border-border pt-4 text-xs text-muted">
        Sumber: Data harga lokal · {lastUpdated ? `Diperbarui ${lastUpdated}` : "Menunggu data"}
      </p>
    </article>
  );
}

export default PriceCard;
