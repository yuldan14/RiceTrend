// utils/api.ts
import { format, parseISO, addDays } from 'date-fns';

// --- Interfaces untuk struktur JSON prediksi lokal ---
interface LocalPredictionData {
  last_updated_date: string;
  predictions_start_date: string;
  prediction_horizon_days: number;
  predictions: {
    medium_silinda: number[];
    premium_silinda: number[];
    medium_bapanas: number[];
    premium_bapanas: number[];
  };
}

// Cache untuk data prediksi lokal agar tidak perlu fetch berulang kali
let arimaPredictionsCache: LocalPredictionData | null = null;
let lstmPredictionsCache: LocalPredictionData | null = null;

// Fungsi helper untuk memuat data prediksi dari JSON lokal
const loadLocalPredictions = async (modelType: 'arima' | 'lstm'): Promise<LocalPredictionData> => {
  let cache = modelType === 'arima' ? arimaPredictionsCache : lstmPredictionsCache;

  if (cache) {
    return cache;
  }

  const filePath = modelType === 'arima' ? '/prediksi_arima.json' : '/prediksi_lstm.json';
  
  try {
    const res = await fetch(filePath);
    if (!res.ok) {
      throw new Error(`Gagal memuat file ${filePath}. Status: ${res.status}`);
    }
    const data: LocalPredictionData = await res.json();
    
    // Simpan ke cache
    if (modelType === 'arima') {
      arimaPredictionsCache = data;
    } else {
      lstmPredictionsCache = data;
    }
    return data;
  } catch (error) {
    console.error(`Error loading local predictions from ${filePath}:`, error);
    throw new Error(`Gagal memuat prediksi lokal untuk ${modelType}. Pastikan file JSON ada dan formatnya benar.`);
  }
};


// Fungsi helper untuk mencari prediksi dari data lokal
const getLocalPrediction = async (commodityType: string, modelType: 'arima' | 'lstm', stepsAhead: number): Promise<number[]> => {
  const data = await loadLocalPredictions(modelType);

  if (!data || !data.predictions) {
    throw new Error(`Data prediksi lokal untuk ${modelType} tidak valid.`);
  }

  // Cari array prediksi untuk commodityType yang diminta
  const commodityPredictions = data.predictions[commodityType as keyof typeof data.predictions];

  if (!commodityPredictions || !Array.isArray(commodityPredictions)) {
    throw new Error(`Tidak ada prediksi untuk ${commodityType} di data ${modelType} lokal.`);
  }

  // Validasi stepsAhead: harus dalam rentang yang tersedia
  if (stepsAhead <= 0 || stepsAhead > commodityPredictions.length) {
    throw new Error(`Steps ahead (${stepsAhead}) di luar jangkauan prediksi yang tersedia (${commodityPredictions.length} hari).`);
  }

  // Mengembalikan slice dari array prediksi
  // stepsAhead = 1 -> index 0, stepsAhead = 5 -> index 0-4
  return commodityPredictions.slice(0, stepsAhead);
};


// --- Fungsi-fungsi spesifik untuk setiap kombinasi beras dan model (memanggil lokal) ---
export const predictMediumSilindaArima = (stepsAhead: number) =>
  getLocalPrediction('medium_silinda', 'arima', stepsAhead);

export const predictMediumSilindaLstm = (stepsAhead: number) =>
  getLocalPrediction('medium_silinda', 'lstm', stepsAhead);

export const predictPremiumSilindaArima = (stepsAhead: number) =>
  getLocalPrediction('premium_silinda', 'arima', stepsAhead);

export const predictPremiumSilindaLstm = (stepsAhead: number) =>
  getLocalPrediction('premium_silinda', 'lstm', stepsAhead);

export const predictMediumBapanasArima = (stepsAhead: number) =>
  getLocalPrediction('medium_bapanas', 'arima', stepsAhead);

export const predictMediumBapanasLstm = (stepsAhead: number) =>
  getLocalPrediction('medium_bapanas', 'lstm', stepsAhead);

export const predictPremiumBapanasArima = (stepsAhead: number) =>
  getLocalPrediction('premium_bapanas', 'arima', stepsAhead);

export const predictPremiumBapanasLstm = (stepsAhead: number) =>
  getLocalPrediction('premium_bapanas', 'lstm', stepsAhead);

// Tambahan untuk mengambil metadata (tanggal, horizon) dari JSON lokal
export const getPredictionMetadata = async (modelType: 'arima' | 'lstm') => {
  const data = await loadLocalPredictions(modelType);
  return {
    lastUpdated: data.last_updated_date,
    startDate: data.predictions_start_date,
    horizon: data.prediction_horizon_days,
  };
};