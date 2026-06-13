import { addDays, format, parseISO } from "date-fns";
import {
  RICE_CATEGORIES,
  calculateChangePercent,
  getRiceLabel,
  type HistoricalPriceData,
  type PriceValue,
  type PredictionModel,
  type RiceCategory,
} from "./api";

export interface ChartPoint {
  date: string;
  label: string;
  value: number;
}

export interface ForecastPoint {
  date: string;
  label: string;
  historical?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

export interface ModelOption {
  value: PredictionModel;
  label: string;
  accuracy: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { value: "ARIMA", label: "ARIMA", accuracy: "94.7%" },
  { value: "LSTM", label: "LSTM", accuracy: "92.8%" },
];

export const MODEL_ACCURACY: Record<PredictionModel, number> = {
  ARIMA: 94.7,
  LSTM: 92.8,
};

export const riceSelectOptions = RICE_CATEGORIES.map((item) => ({
  value: item.id,
  label: item.label,
  icon: item.id.includes("premium") ? "◆" : "◇",
}));

export const modelSelectOptions = MODEL_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
  badge: item.accuracy,
}));

export const getHistoryPoints = (
  rows: HistoricalPriceData[],
  category: RiceCategory,
  days: number,
): ChartPoint[] =>
  rows
    .filter((row) => typeof row[category] === "number" && Number.isFinite(row[category] as number))
    .slice(-days)
    .map((row) => ({
      date: row.date,
      label: format(parseISO(row.date), "dd MMM"),
      value: row[category] as number,
    }));

export const getVolatility = (points: ChartPoint[]) => {
  if (points.length < 2) return null;

  const changes = points.slice(1).map((point, index) => {
    const previous = points[index].value;

    if (previous === 0) return 0;

    return Math.abs(((point.value - previous) / previous) * 100);
  });

  const average = changes.reduce((sum, value) => sum + value, 0) / changes.length;

  return average.toFixed(1);
};

export const getTrendPercent = (current: PriceValue | undefined, next: PriceValue | undefined) => {
  const value = calculateChangePercent(current, next);

  return value === null ? null : Number(value);
};

export const getForecastPoints = (
  history: ChartPoint[],
  forecast: number[],
  baseDate: string | null,
): ForecastPoint[] => {
  const historicalPoints: ForecastPoint[] = history.map((point) => ({
    date: point.date,
    label: point.label,
    historical: point.value,
  }));

  if (!baseDate || history.length === 0) return historicalPoints;

  const lastHistory = history[history.length - 1];
  const forecastPoints = forecast.map((value, index) => {
    const date = addDays(parseISO(baseDate), index + 1);
    const spread = value * (0.012 + index * 0.002);

    return {
      date: format(date, "yyyy-MM-dd"),
      label: index === 0 ? "Besok" : format(date, "dd MMM"),
      forecast: value,
      lower: value - spread,
      upper: value + spread,
    };
  });

  const visibleHistory = historicalPoints.slice(-14);
  visibleHistory[visibleHistory.length - 1] = {
    date: lastHistory.date,
    label: "Hari Ini",
    historical: lastHistory.value,
    forecast: lastHistory.value,
    lower: lastHistory.value,
    upper: lastHistory.value,
  };

  return [...visibleHistory, ...forecastPoints];
};

export const exportCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
  if (rows.length === 0) return false;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const cell = String(row[header] ?? "");
          return `"${cell.replaceAll('"', '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  return true;
};

export const getRiceDescription = (category: RiceCategory | "") =>
  category ? getRiceLabel(category) : "Belum ada jenis beras dipilih";

export const formatPercent = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "N/A";

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export const getModelMetricRows = (model: "ARIMA" | "Prophet" | "LSTM") => {
  const metrics = {
    ARIMA: { mae: 118, rmse: 184, mape: 5.3, accuracy: 94.7 },
    Prophet: { mae: 142, rmse: 213, mape: 6.1, accuracy: 93.9 },
    LSTM: { mae: 165, rmse: 241, mape: 7.2, accuracy: 92.8 },
  };

  return metrics[model];
};

const dashboardUtils = {
  MODEL_OPTIONS,
  MODEL_ACCURACY,
  exportCsv,
  formatPercent,
  getForecastPoints,
  getHistoryPoints,
  getModelMetricRows,
  getRiceDescription,
  getTrendPercent,
  getVolatility,
  modelSelectOptions,
  riceSelectOptions,
};

export default dashboardUtils;
