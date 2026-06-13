"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Database, RefreshCw } from "lucide-react";
import { ControlBar } from "@/components/dashboard/ControlBar";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { PriceCard } from "@/components/dashboard/PriceCard";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { notifyError, notifyInfo, notifySuccess } from "@/components/ui/Toast";
import {
  getHistoricalPrices,
  getLastHistoricalDate,
  getLatestPriceSnapshot,
  getPrediction,
  type HistoricalPriceData,
  type PredictionModel,
  type SelectedRiceCategory,
} from "@/utils/api";
import {
  MODEL_ACCURACY,
  exportCsv,
  getForecastPoints,
  getHistoryPoints,
  getTrendPercent,
  getVolatility,
} from "@/utils/dashboard";

export interface DashboardProps {
  variant?: "overview" | "prediction";
}

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function Dashboard({ variant = "overview" }: DashboardProps) {
  const [rice, setRice] = useState<SelectedRiceCategory>("");
  const [model, setModel] = useState<PredictionModel>("ARIMA");
  const [rows, setRows] = useState<HistoricalPriceData[]>([]);
  const [forecastValues, setForecastValues] = useState<number[]>([]);
  const [comparison, setComparison] = useState<number | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertThreshold, setAlertThreshold] = useState(3);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);

    try {
      const data = await getHistoricalPrices();
      setRows(data);

      if (data.length > 0) {
        setStartDate((value) => value || data[Math.max(0, data.length - 30)].date);
        setEndDate((value) => value || data[data.length - 1].date);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Data historis gagal dimuat.";
      notifyError(message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  useEffect(() => {
    const storedThreshold = Number(window.localStorage.getItem("ricetrend-alert-threshold"));
    const storedAlerts = window.localStorage.getItem("ricetrend-alert-enabled");
    if (Number.isFinite(storedThreshold) && storedThreshold > 0) {
      setAlertThreshold(storedThreshold);
    }
    if (storedAlerts !== null) setAlertsEnabled(storedAlerts === "true");
  }, []);

  const lastHistoricalDate = getLastHistoricalDate(rows);

  const loadPrediction = useCallback(async () => {
    if (!rice || !lastHistoricalDate) {
      setForecastValues([]);
      setComparison(null);
      setPredictionError("");
      return;
    }

    setLoadingPrediction(true);
    setPredictionError("");

    try {
      const predictionStart = format(
        new Date(parseISO(lastHistoricalDate).getTime() + 24 * 60 * 60 * 1000),
        "yyyy-MM-dd",
      );
      const otherModel: PredictionModel = model === "ARIMA" ? "LSTM" : "ARIMA";
      const [selectedSeries, comparisonSeries] = await Promise.all([
        getPrediction(rice, model, 7, { startDate: predictionStart }),
        getPrediction(rice, otherModel, 1, { startDate: predictionStart }),
      ]);
      setForecastValues(selectedSeries);
      setComparison(comparisonSeries[0] ?? null);
      notifySuccess("Prediksi dimuat");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Prediksi gagal dimuat.";
      setPredictionError(message);
      notifyError("Gagal memuat data - coba refresh");
    } finally {
      setLoadingPrediction(false);
    }
  }, [lastHistoricalDate, model, rice]);

  useEffect(() => {
    void loadPrediction();
  }, [loadPrediction, refreshKey]);

  useEffect(() => {
    const refreshInterval = Number(
      window.localStorage.getItem("ricetrend-refresh-interval") ?? "5",
    );

    if (!Number.isFinite(refreshInterval) || refreshInterval <= 0) return;

    const timer = window.setInterval(() => {
      setRefreshKey((value) => value + 1);
      notifyInfo(`Data diperbarui otomatis setiap ${refreshInterval} menit`);
    }, refreshInterval * 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const latestPrices = useMemo(() => getLatestPriceSnapshot(rows), [rows]);
  const previousPrices = useMemo(() => getLatestPriceSnapshot(rows, 1), [rows]);
  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) => (!startDate || row.date >= startDate) && (!endDate || row.date <= endDate),
      ),
    [endDate, rows, startDate],
  );
  const history = useMemo(
    () => (rice ? getHistoryPoints(filteredRows, rice, 30) : []),
    [filteredRows, rice],
  );
  const sparkline = history.slice(-7);
  const currentPrice = rice ? latestPrices[rice] ?? null : null;
  const previousPrice = rice ? previousPrices[rice] ?? null : null;
  const prediction = forecastValues[0] ?? null;
  const currentChange = getTrendPercent(previousPrice, currentPrice);
  const predictionChange = getTrendPercent(currentPrice, prediction);
  const volatility = getVolatility(history);
  const forecast = getForecastPoints(history, forecastValues, lastHistoricalDate);
  const lastUpdated = lastHistoricalDate
    ? format(parseISO(lastHistoricalDate), "dd MMM yyyy")
    : null;

  const handleRefresh = () => setRefreshKey((value) => value + 1);

  const handleExport = () => {
    const exported = exportCsv(
      `ricetrend-${rice || "semua"}-${endDate || "data"}.csv`,
      filteredRows.map((row) => ({
        tanggal: row.date,
        medium_silinda: row.medium_silinda ?? "",
        premium_silinda: row.premium_silinda ?? "",
        medium_bapanas: row.medium_bapanas ?? "",
        premium_bapanas: row.premium_bapanas ?? "",
      })),
    );

    if (exported) notifySuccess("Data berhasil diekspor");
  };

  const title = variant === "prediction" ? "Prediksi Harga Beras" : "Overview Harga Beras";
  const subtitle =
    variant === "prediction"
      ? `Model ${model} · Data terakhir ${lastUpdated ?? "belum tersedia"}`
      : `Pantau harga dan proyeksi harian · Diperbarui ${lastUpdated ?? "belum tersedia"}`;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Badge variant="status">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Data lokal
            </Badge>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700"
              aria-label="Perbarui data"
              title="Perbarui data"
            >
              <RefreshCw
                className={loadingHistory || loadingPrediction ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                aria-hidden="true"
              />
            </button>
          </>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <motion.div variants={cardVariants}>
          <ControlBar
            rice={rice}
            model={model}
            startDate={startDate}
            endDate={endDate}
            loading={loadingHistory || loadingPrediction}
            onRiceChange={setRice}
            onModelChange={setModel}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onRefresh={handleRefresh}
            onExport={handleExport}
          />
        </motion.div>

        <motion.div variants={cardVariants}>
          <StatsRow
            currentPrice={currentPrice}
            prediction={prediction}
            trendPercent={predictionChange}
            volatility={volatility}
            accuracy={MODEL_ACCURACY[model]}
            model={model}
            sparkline={sparkline}
            loading={loadingHistory || (!!rice && loadingPrediction)}
          />
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-2">
          <motion.div variants={cardVariants}>
            <PriceCard
              rice={rice}
              price={currentPrice}
              change={currentChange}
              history={history}
              lastUpdated={lastUpdated}
              loading={loadingHistory}
              alertThreshold={alertsEnabled ? alertThreshold : Number.POSITIVE_INFINITY}
            />
          </motion.div>
          <motion.div variants={cardVariants}>
            <PredictionCard
              rice={rice}
              model={model}
              prediction={prediction}
              comparison={comparison}
              change={predictionChange}
              forecast={forecast}
              loading={loadingPrediction}
              error={predictionError}
              onRetry={() => void loadPrediction()}
            />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default Dashboard;
