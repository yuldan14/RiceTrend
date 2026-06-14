"use client";

import CountUp from "react-countup";
import { AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, type PredictionModel, type SelectedRiceCategory } from "@/utils/api";
import { formatPercent, type ForecastPoint } from "@/utils/dashboard";

export interface PredictionCardProps {
  rice: SelectedRiceCategory;
  model: PredictionModel;
  prediction: number | null;
  comparison: number | null;
  change: number | null;
  forecast: ForecastPoint[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function PredictionCard({
  rice,
  model,
  prediction,
  comparison,
  change,
  forecast,
  loading,
  error,
  onRetry,
}: PredictionCardProps) {
  if (loading) {
    return (
      <article className="rounded-card border border-border bg-white p-4 shadow-card sm:p-6" aria-busy="true">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-8 h-12 w-56" />
        <Skeleton className="mt-6 h-72 w-full" />
      </article>
    );
  }

  if (!rice) {
    return (
      <article className="rounded-card border border-border bg-white p-4 shadow-card sm:p-6">
        <EmptyState
          icon={
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-brand-500">
              <TrendingUp className="h-7 w-7" aria-hidden="true" />
            </span>
          }
          title="Pilih jenis beras dan model"
          description="Prediksi tujuh hari, rentang keyakinan, dan perbandingan model muncul di sini."
        />
      </article>
    );
  }

  if (error) {
    return (
      <article className="rounded-card border border-amber-200 bg-amber-50 p-4 shadow-card sm:p-6">
        <EmptyState
          icon={<AlertCircle className="h-8 w-8 text-amber-500" aria-hidden="true" />}
          title="Data belum tersedia"
          description={error}
          action={
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-slate-900"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Coba Lagi
            </button>
          }
        />
      </article>
    );
  }

  if (prediction === null) {
    return (
      <article className="rounded-card border border-border bg-white p-4 shadow-card sm:p-6">
        <EmptyState
          icon={<TrendingUp className="h-8 w-8" aria-hidden="true" />}
          title="Prediksi belum tersedia"
          description="Nilai prediksi untuk rentang tanggal ini masih kosong."
        />
      </article>
    );
  }

  const spread = prediction * 0.018;
  const otherModel = model === "ARIMA" ? "LSTM" : "ARIMA";

  return (
    <article className="min-w-0 rounded-card border border-border bg-white p-4 shadow-card transition hover:shadow-card-hover sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Prediksi Harga Berikutnya</h2>
          <p className="mt-1 text-xs text-muted">Proyeksi setelah data terakhir tersedia</p>
        </div>
        <Badge variant="model">{model}</Badge>
      </div>

      <div className="mt-7 flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-xl font-bold text-slate-700 sm:text-2xl">Rp</span>
          <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
            <CountUp end={Math.round(prediction)} duration={0.6} separator="." />
          </p>
          <span className="text-sm font-medium text-muted">/kg</span>
        </div>
        <Badge variant={change === null ? "neutral" : change >= 0 ? "up" : "down"}>
          {formatPercent(change)}
        </Badge>
      </div>

      <div className="mt-6 rounded-xl bg-surface p-4">
        <div className="flex flex-col gap-1.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span>Rentang prediksi</span>
          <span className="font-semibold text-slate-700 tabular-nums">
            {formatCurrency(prediction - spread)} - {formatCurrency(prediction + spread)}
          </span>
        </div>
        <div className="relative mt-3 h-2 rounded-pill bg-brand-100">
          <span className="absolute left-1/2 top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-pill bg-brand-600" />
        </div>
        <p className="mt-3 text-xs text-muted">
          vs model {otherModel}:{" "}
          <span className="font-semibold text-slate-700 tabular-nums">{formatCurrency(comparison)}</span>
        </p>
      </div>

      <div className="mt-5">
        <ForecastChart data={forecast} />
      </div>
    </article>
  );
}

export default PredictionCard;
