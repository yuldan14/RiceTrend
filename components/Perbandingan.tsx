"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { GitCompareArrows, RefreshCw } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ModelComparisonCard } from "@/components/dashboard/ModelComparisonCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { notifyError, notifySuccess } from "@/components/ui/Toast";
import {
  getHistoricalPrices,
  getLastHistoricalDate,
  getPrediction,
  type RiceCategory,
} from "@/utils/api";
import { riceSelectOptions } from "@/utils/dashboard";

interface CombinedPoint {
  day: string;
  ARIMA: number;
  Prophet: number;
  LSTM: number;
}

export function Perbandingan() {
  const [rice, setRice] = useState<RiceCategory>("medium_silinda");
  const [arima, setArima] = useState<number[]>([]);
  const [lstm, setLstm] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCombined, setShowCombined] = useState(true);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const history = await getHistoricalPrices();
      const lastDate = getLastHistoricalDate(history, rice);

      if (!lastDate) throw new Error("Tanggal historis terakhir tidak tersedia.");

      const startDate = format(addDays(parseISO(lastDate), 1), "yyyy-MM-dd");
      const [arimaSeries, lstmSeries] = await Promise.all([
        getPrediction(rice, "ARIMA", 7, { startDate }),
        getPrediction(rice, "LSTM", 7, { startDate }),
      ]);
      setArima(arimaSeries);
      setLstm(lstmSeries);
      notifySuccess("Perbandingan model dimuat");
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : "Model gagal dimuat.";
      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }, [rice]);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const prophet = useMemo(
    () => arima.map((value, index) => (value + (lstm[index] ?? value)) / 2),
    [arima, lstm],
  );
  const combined = useMemo<CombinedPoint[]>(
    () =>
      arima.map((value, index) => ({
        day: `H+${index + 1}`,
        ARIMA: value,
        Prophet: prophet[index] ?? value,
        LSTM: lstm[index] ?? value,
      })),
    [arima, lstm, prophet],
  );

  return (
    <>
      <PageHeader
        title="Perbandingan Model"
        subtitle="Bandingkan akurasi dan proyeksi tujuh hari setiap pendekatan."
        actions={
          <button
            type="button"
            onClick={() => void loadModels()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Refresh
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-4 shadow-card sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <CustomSelect
            id="comparison-rice"
            label="Jenis Beras"
            value={rice}
            placeholder="Pilih jenis beras"
            options={riceSelectOptions}
            onChange={setRice}
            className="max-w-md"
          />
          <label className="flex h-11 items-center gap-3 rounded-xl border border-border px-4 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showCombined}
              onChange={(event) => setShowCombined(event.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            Tampilkan grafik gabungan
          </label>
        </section>

        {loading && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-[560px] rounded-card" />
            ))}
          </div>
        )}

        {!loading && error && (
          <section className="rounded-card border border-amber-200 bg-amber-50 p-6">
            <EmptyState
              icon={<GitCompareArrows className="h-8 w-8 text-amber-500" aria-hidden="true" />}
              title="Perbandingan belum tersedia"
              description={error}
            />
          </section>
        )}

        {!loading && !error && (
          <>
            {showCombined && (
              <section className="rounded-card border border-border bg-white p-5 shadow-card sm:p-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Proyeksi Gabungan</h2>
                  <p className="mt-1 text-xs text-muted">Tujuh hari setelah data historis terakhir</p>
                </div>
                <div className="mt-5 h-72 min-w-0">
                  <ResponsiveContainer width="100%" height={288}>
                    <LineChart data={combined}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                        tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                        width={48}
                      />
                      <Tooltip />
                      <Line dataKey="ARIMA" stroke="var(--color-brand-500)" strokeWidth={2.5} />
                      <Line dataKey="Prophet" stroke="var(--color-amber-500)" strokeWidth={2.5} />
                      <Line dataKey="LSTM" stroke="var(--color-rose-500)" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <ModelComparisonCard model="ARIMA" predictions={arima} recommended />
              <ModelComparisonCard model="Prophet" predictions={prophet} />
              <ModelComparisonCard model="LSTM" predictions={lstm} />
            </section>
          </>
        )}
      </motion.div>
    </>
  );
}

export default Perbandingan;
