import { addDays, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

export const RICE_CATEGORIES = [
  { id: "medium_silinda", label: "Beras Medium Silinda" },
  { id: "premium_silinda", label: "Beras Premium Silinda" },
  { id: "medium_bapanas", label: "Beras Medium Bapanas" },
  { id: "premium_bapanas", label: "Beras Premium Bapanas" },
] as const;

export type RiceCategory = (typeof RICE_CATEGORIES)[number]["id"];
export type SelectedRiceCategory = RiceCategory | "";
export type PredictionModel = "ARIMA" | "LSTM";
export type SpecialPeriod = "" | "IdulFitri" | "TahunBaru";
export type PriceValue = number | null;
export type HargaData = Partial<Record<RiceCategory, PriceValue>>;
export type Trend = "Naik" | "Turun" | "Stabil" | "N/A";

export interface HistoricalPriceData {
  id: number;
  date: string;
  medium_silinda: PriceValue;
  premium_silinda: PriceValue;
  medium_bapanas: PriceValue;
  premium_bapanas: PriceValue;
}

interface LocalPredictionData {
  last_updated_date: string;
  predictions_start_date: string;
  prediction_horizon_days: number;
  predictions: Record<RiceCategory, PriceValue[]>;
}

const HISTORICAL_PRICE_PATH = "/data_harga.json";
const PREDICTION_PATHS: Record<PredictionModel, string> = {
  ARIMA: "/prediksi_arima.json",
  LSTM: "/prediksi_lstm.json",
};

const IDUL_FITRI_DATES = ["2025-03-31", "2026-03-20", "2027-03-09"];
const jsonCache = new Map<string, Promise<unknown>>();
let historicalPriceCache: Promise<HistoricalPriceData[]> | null = null;
const predictionCache: Partial<Record<PredictionModel, Promise<LocalPredictionData>>> = {};

const riceCategorySet = new Set<string>(RICE_CATEGORIES.map((item) => item.id));

export const isRiceCategory = (value: string): value is RiceCategory => riceCategorySet.has(value);

export const getRiceLabel = (category: string) =>
  RICE_CATEGORIES.find((item) => item.id === category)?.label ?? category;

export const formatCurrency = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? `Rp ${Math.round(value).toLocaleString("id-ID")}`
    : "N/A";

export const calculateChangePercent = (
  currentPrice: PriceValue | undefined,
  predictedPrice: PriceValue | undefined,
) => {
  if (
    typeof currentPrice !== "number" ||
    !Number.isFinite(currentPrice) ||
    currentPrice === 0 ||
    typeof predictedPrice !== "number" ||
    !Number.isFinite(predictedPrice)
  ) {
    return null;
  }

  return (((predictedPrice - currentPrice) / currentPrice) * 100).toFixed(2);
};

const loadJson = async <T>(path: string): Promise<T> => {
  if (!jsonCache.has(path)) {
    const request = fetch(path)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Gagal memuat ${path}. Status: ${response.status}`);
        }

        return response.json();
      })
      .catch((error) => {
        jsonCache.delete(path);
        throw error;
      });

    jsonCache.set(path, request);
  }

  return jsonCache.get(path) as Promise<T>;
};

const normalizePrice = (value: unknown): PriceValue => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeFiniteNumber = (value: unknown, fallback: number) => {
  if (
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
  ) {
    return Number(value);
  }

  return fallback;
};

const normalizeDate = (value: unknown) => {
  if (typeof value !== "string" || !isValid(parseISO(value))) return null;

  return value;
};

const normalizeHistoricalRows = (payload: unknown): HistoricalPriceData[] => {
  if (!Array.isArray(payload)) {
    throw new Error("Format data historis tidak valid.");
  }

  return payload
    .flatMap((row, index) => {
      if (!isRecord(row)) return [];

      const date = normalizeDate(row.date);
      if (!date) return [];

      return [{
        id: normalizeFiniteNumber(row.id, index + 1),
        date,
        medium_silinda: normalizePrice(row.medium_silinda),
        premium_silinda: normalizePrice(row.premium_silinda),
        medium_bapanas: normalizePrice(row.medium_bapanas),
        premium_bapanas: normalizePrice(row.premium_bapanas),
      }];
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
};

const normalizePredictionData = (payload: unknown): LocalPredictionData => {
  if (!isRecord(payload) || !isRecord(payload.predictions)) {
    throw new Error("Format data prediksi tidak valid.");
  }

  const lastUpdatedDate = normalizeDate(payload.last_updated_date);
  const predictionsStartDate = normalizeDate(payload.predictions_start_date);
  const predictionHorizon = normalizeFiniteNumber(payload.prediction_horizon_days, 0);

  if (!lastUpdatedDate || !predictionsStartDate || predictionHorizon <= 0) {
    throw new Error("Metadata data prediksi tidak valid.");
  }

  const predictions = {} as Record<RiceCategory, PriceValue[]>;

  for (const { id } of RICE_CATEGORIES) {
    const series = payload.predictions[id];

    if (!Array.isArray(series)) {
      throw new Error(`Tidak ada prediksi untuk ${id}.`);
    }

    predictions[id] = series.map(normalizePrice);
  }

  return {
    last_updated_date: lastUpdatedDate,
    predictions_start_date: predictionsStartDate,
    prediction_horizon_days: predictionHorizon,
    predictions,
  };
};

const getValidPrice = (row: HistoricalPriceData, category: RiceCategory) => {
  const value = row[category];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const getHistoricalPrices = async () => {
  if (!historicalPriceCache) {
    historicalPriceCache = loadJson<unknown>(HISTORICAL_PRICE_PATH)
      .then(normalizeHistoricalRows)
      .catch((error) => {
        historicalPriceCache = null;
        throw error;
      });
  }

  return historicalPriceCache;
};

export const getLatestPriceSnapshot = (rows: HistoricalPriceData[], offset = 0): HargaData => {
  const snapshot: HargaData = {};

  for (const { id } of RICE_CATEGORIES) {
    let seen = 0;

    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const value = rows[index][id];

      if (typeof value === "number" && Number.isFinite(value)) {
        if (seen === offset) {
          snapshot[id] = value;
          break;
        }

        seen += 1;
      }
    }
  }

  return snapshot;
};

export const getLastHistoricalDate = (
  rows: HistoricalPriceData[],
  category?: RiceCategory,
) => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (!category || getValidPrice(rows[index], category) !== null) {
      return rows[index].date;
    }
  }

  return null;
};

const loadPredictionData = async (model: PredictionModel) => {
  if (!predictionCache[model]) {
    predictionCache[model] = loadJson<unknown>(PREDICTION_PATHS[model])
      .then(normalizePredictionData)
      .catch((error) => {
        delete predictionCache[model];
        throw error;
      });
  }

  return predictionCache[model] as Promise<LocalPredictionData>;
};

export const getPredictionMetadata = async (model: PredictionModel) => {
  const data = await loadPredictionData(model);

  return {
    lastUpdated: data.last_updated_date,
    startDate: data.predictions_start_date,
    horizon: data.prediction_horizon_days,
  };
};

export const getPrediction = async (
  category: RiceCategory,
  model: PredictionModel,
  stepsAhead: number,
  options: { startDate?: string } = {},
) => {
  if (stepsAhead <= 0) {
    return [];
  }

  const data = await loadPredictionData(model);
  const series = data.predictions[category];

  if (!Array.isArray(series)) {
    throw new Error(`Tidak ada prediksi untuk ${category} pada model ${model}.`);
  }

  const requestStartDate = options.startDate ?? data.predictions_start_date;
  const startIndex = differenceInCalendarDays(
    parseISO(requestStartDate),
    parseISO(data.predictions_start_date),
  );
  const endIndex = startIndex + stepsAhead;

  if (startIndex < 0) {
    throw new Error(
      `Tanggal mulai ${requestStartDate} lebih awal dari data prediksi ${data.predictions_start_date}.`,
    );
  }

  if (endIndex > series.length) {
    throw new Error(`Rentang prediksi ${stepsAhead} hari melebihi horizon ${series.length} hari.`);
  }

  const selectedSeries = series.slice(startIndex, endIndex);
  const missingIndex = selectedSeries.findIndex(
    (value) => typeof value !== "number" || !Number.isFinite(value),
  );

  if (missingIndex >= 0) {
    const missingDate = format(addDays(parseISO(requestStartDate), missingIndex), "yyyy-MM-dd");
    throw new Error(`Prediksi ${category} untuk ${missingDate} tidak tersedia.`);
  }

  return selectedSeries as number[];
};

export const getPredictionSeriesToDate = async (
  category: RiceCategory,
  model: PredictionModel,
  baseDate: string,
  targetDate: Date,
) => {
  const predictionStartDate = addDays(parseISO(baseDate), 1);
  const stepsAhead = differenceInCalendarDays(targetDate, predictionStartDate) + 1;

  if (stepsAhead <= 0) {
    return [];
  }

  return getPrediction(category, model, stepsAhead, {
    startDate: format(predictionStartDate, "yyyy-MM-dd"),
  });
};

export const getTomorrowPrediction = async (
  category: RiceCategory,
  model: PredictionModel,
  baseDate: string,
) => getPredictionSeriesToDate(category, model, baseDate, addDays(parseISO(baseDate), 1));

export const getTrend = (
  currentPrice: PriceValue | undefined,
  predictions: Array<PriceValue | undefined>,
): Trend => {
  if (typeof currentPrice !== "number" || !Number.isFinite(currentPrice)) {
    return "N/A";
  }

  const validPredictions = predictions.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (validPredictions.length === 0) {
    return "N/A";
  }

  const averagePrediction =
    validPredictions.reduce((sum, value) => sum + value, 0) / validPredictions.length;
  const threshold = currentPrice * 0.01;

  if (averagePrediction > currentPrice + threshold) return "Naik";
  if (averagePrediction < currentPrice - threshold) return "Turun";
  return "Stabil";
};

export const getNextNewYearDate = (baseDate: string) => {
  const base = parseISO(baseDate);
  let target = new Date(base.getFullYear() + 1, 0, 1);

  if (differenceInCalendarDays(target, base) <= 0) {
    target = new Date(base.getFullYear() + 2, 0, 1);
  }

  return target;
};

export const getNextIdulFitriDate = (baseDate: string) => {
  const base = parseISO(baseDate);

  return (
    IDUL_FITRI_DATES.map((date) => parseISO(date)).find(
      (date) => differenceInCalendarDays(date, base) > 0,
    ) ?? null
  );
};

export const getDaysFromBaseToTarget = (baseDate: string, targetDate: Date) =>
  Math.max(differenceInCalendarDays(targetDate, parseISO(baseDate)), 0);

export const predictMediumSilindaArima = (stepsAhead: number) =>
  getPrediction("medium_silinda", "ARIMA", stepsAhead);

export const predictMediumSilindaLstm = (stepsAhead: number) =>
  getPrediction("medium_silinda", "LSTM", stepsAhead);

export const predictPremiumSilindaArima = (stepsAhead: number) =>
  getPrediction("premium_silinda", "ARIMA", stepsAhead);

export const predictPremiumSilindaLstm = (stepsAhead: number) =>
  getPrediction("premium_silinda", "LSTM", stepsAhead);

export const predictMediumBapanasArima = (stepsAhead: number) =>
  getPrediction("medium_bapanas", "ARIMA", stepsAhead);

export const predictMediumBapanasLstm = (stepsAhead: number) =>
  getPrediction("medium_bapanas", "LSTM", stepsAhead);

export const predictPremiumBapanasArima = (stepsAhead: number) =>
  getPrediction("premium_bapanas", "ARIMA", stepsAhead);

export const predictPremiumBapanasLstm = (stepsAhead: number) =>
  getPrediction("premium_bapanas", "LSTM", stepsAhead);
