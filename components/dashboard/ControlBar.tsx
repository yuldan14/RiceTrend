"use client";

import { Download, RefreshCw } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  modelSelectOptions,
  riceSelectOptions,
} from "@/utils/dashboard";
import type { PredictionModel, SelectedRiceCategory } from "@/utils/api";

export interface ControlBarProps {
  rice: SelectedRiceCategory;
  model: PredictionModel;
  startDate: string;
  endDate: string;
  loading: boolean;
  onRiceChange: (value: Exclude<SelectedRiceCategory, "">) => void;
  onModelChange: (value: PredictionModel) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export function ControlBar({
  rice,
  model,
  startDate,
  endDate,
  loading,
  onRiceChange,
  onModelChange,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  onExport,
}: ControlBarProps) {
  return (
    <section className="rounded-card border border-border bg-white px-4 py-4 shadow-card sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <CustomSelect
            id="jenis-beras"
            label="Jenis Beras"
            value={rice}
            placeholder="Pilih jenis beras"
            options={riceSelectOptions}
            onChange={onRiceChange}
          />
          <CustomSelect
            id="model-prediksi"
            label="Model Prediksi"
            value={model}
            placeholder="Pilih model"
            options={modelSelectOptions}
            onChange={onModelChange}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:flex">
          <label className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Dari</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-slate-800 shadow-sm"
            />
          </label>
          <label className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Sampai</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-slate-800 shadow-sm"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 xl:flex-none"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 xl:flex-none"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>
    </section>
  );
}

export default ControlBar;
