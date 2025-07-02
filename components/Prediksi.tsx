// beras-frontend/components/Prediksi.tsx
'use client'; 

import React, { useState, useEffect, useCallback } from "react"; // Impor useCallback
import NewYearPred from "./NewYearPred"; 
import IdulFitriPred from "./IdulFitriPred"; 
import PriceChart from "./PriceChart"; 
// Tidak perlu mengimpor predict... dari '../utils/api' di sini karena semua prediksi diambil dari JSON lokal

// --- Interfaces ---
type HargaData = {
  [key: string]: number | undefined;
};

interface HistoricalPriceData {
  id: number;
  date: string;
  medium_silinda: number;
  premium_silinda: number;
  medium_bapanas: number;
  premium_bapanas: number;
}

const Prediksi = () => {
  // --- States untuk pilihan pengguna dari dropdown ---
  const [jenisBeras, setJenisBeras] = useState<keyof HargaData>('');
  const [model, setModel] = useState<'ARIMA' | 'LSTM'>('ARIMA'); // Default model ke ARIMA
  const [periodePrediksi, setPeriodePrediksi] = useState<'' | 'IdulFitri' | 'TahunBaru'>('');

  // --- States untuk data historis lokal (diperlukan untuk "Harga Saat Ini" dan grafik) ---
  const [hargaHariIni, setHargaHariIni] = useState<HargaData>({});
  const [allHistoricalDataLocal, setAllHistoricalDataLocal] = useState<HistoricalPriceData[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(true);
  const [errorHistorical, setErrorHistorical] = useState('');

  // --- States untuk hasil prediksi (diperlukan untuk tampilan "Besok" dan untuk diteruskan ke grafik) ---
  const [prediksiBesokSeries, setPrediksiBesokSeries] = useState<number[] | null>(null);
  const [loadingPrediksiBesok, setLoadingPrediksiBesok] = useState(false);
  const [errorPrediksiBesok, setErrorPrediksiBesok] = useState('');

  // States ini menerima SELURUH DERET prediksi dari NewYearPred dan IdulFitriPred via callback,
  // lalu digunakan oleh PriceChart untuk titik prediksi di masa depan.
  const [chartPredictionNewYearSeries, setChartPredictionNewYearSeries] = useState<number[] | null>(null);
  const [chartPredictionIdulFitriSeries, setChartPredictionIdulFitriSeries] = useState<number[] | null>(null);

  // --- Efek samping: Mengambil Data Historis Lokal dari public/data_harga.json ---
  const fetchLocalHistoricalData = useCallback(async () => { // Gunakan useCallback
    try {
      const res = await fetch('/data_harga.json');
      if (!res.ok) {
          throw new Error('Gagal memuat data historis lokal.');
      }

      const dataArray: HistoricalPriceData[] = await res.json();
      setAllHistoricalDataLocal(dataArray);

      if (dataArray.length > 0) {
        const latestData = dataArray[dataArray.length - 1];
        setHargaHariIni({
          medium_silinda: latestData.medium_silinda,
          premium_silinda: latestData.premium_silinda,
          medium_bapanas: latestData.medium_bapanas,
          premium_bapanas: latestData.premium_bapanas,
        });
      } else {
          setErrorHistorical('Data historis lokal kosong.');
      }
    } catch (err: unknown) {
      console.error('Error fetching local historical prices:', err);
      if (err instanceof Error) {
          setErrorHistorical(`Gagal memuat harga terkini dari lokal: ${err.message}`);
      } else {
          setErrorHistorical('Gagal memuat harga terkini dari lokal: Terjadi kesalahan tidak diketahui.');
      }
    } finally {
      setLoadingHistorical(false);
    }
  }, []); // Dependensi kosong karena tidak bergantung pada props/state

  useEffect(() => {
    fetchLocalHistoricalData();
  }, [fetchLocalHistoricalData]); // Tambahkan fetchLocalHistoricalData sebagai dependensi

  // --- Efek samping: Mengambil Prediksi Harga Besok dari utils/api (dari JSON lokal) ---
  const fetchPredictionTomorrow = useCallback(async () => { // Gunakan useCallback
    if (!jenisBeras || Object.keys(hargaHariIni).length === 0) {
      setPrediksiBesokSeries(null);
      setErrorPrediksiBesok('Pilih jenis beras dan tunggu data harga lokal dimuat.');
      return;
    }

    setLoadingPrediksiBesok(true);
    setErrorPrediksiBesok('');
    setPrediksiBesokSeries(null);

    try {
      let predictionResult: number[] = [];
      const stepsAhead = 1; 

      const api = await import('../utils/api'); 
      switch (jenisBeras) {
        case 'medium_silinda':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictMediumSilindaArima(stepsAhead)
              : await api.predictMediumSilindaLstm(stepsAhead);
          break;
        case 'premium_silinda':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictPremiumSilindaArima(stepsAhead)
              : await api.predictPremiumSilindaLstm(stepsAhead);
          break;
        case 'medium_bapanas':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictMediumBapanasArima(stepsAhead)
              : await api.predictMediumBapanasLstm(stepsAhead);
          break;
        case 'premium_bapanas':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictPremiumBapanasArima(stepsAhead)
              : await api.predictPremiumBapanasLstm(stepsAhead);
          break;
        default:
          setErrorPrediksiBesok('Jenis beras tidak valid.');
          setLoadingPrediksiBesok(false);
          return;
        }

        if (predictionResult.length > 0) {
          setPrediksiBesokSeries(predictionResult); 
        } else {
          setErrorPrediksiBesok('API tidak mengembalikan hasil prediksi.');
        }
      } catch (err: unknown) {
        console.error('Error fetching tomorrow prediction:', err);
        if (err instanceof Error) {
            setErrorPrediksiBesok(`Gagal mengambil prediksi besok: ${err.message}`);
        } else {
            setErrorPrediksiBesok('Gagal mengambil prediksi besok: Terjadi kesalahan tidak diketahui.');
        }
      } finally {
        setLoadingPrediksiBesok(false);
      }
    }, [jenisBeras, model, hargaHariIni]); // Dependensi

  useEffect(() => {
    if (jenisBeras && Object.keys(hargaHariIni).length > 0) {
        fetchPredictionTomorrow();
    } else {
        setPrediksiBesokSeries(null); 
        setErrorPrediksiBesok('');
    }
  }, [jenisBeras, hargaHariIni, fetchPredictionTomorrow]); 

  // --- Fungsi: Hitung Persentase Perubahan Harga Besok ---
  const hitungPersentasePerubahanBesok = () => {
    const prediksiAkhirBesok = prediksiBesokSeries && prediksiBesokSeries.length > 0
      ? prediksiBesokSeries[0] 
      : null;

    if (
      jenisBeras &&
      prediksiAkhirBesok !== null &&
      hargaHariIni[jenisBeras] !== undefined &&
      hargaHariIni[jenisBeras] !== 0
    ) {
      const hargaSekarang = hargaHariIni[jenisBeras] as number;
      const perubahan = ((prediksiAkhirBesok - hargaSekarang) / hargaSekarang) * 100;
      return perubahan.toFixed(2);
    }
    return null;
  };

  // Helper function to format jenis beras name
  const formatJenisBerasName = (jenisBeras: string): string => {
    return jenisBeras.replace('_', ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
  };

  const persentaseBesok = hitungPersentasePerubahanBesok();
  const isNaikBesok = persentaseBesok !== null && Number(persentaseBesok) > 0;
  const isTurunBesok = persentaseBesok !== null && Number(persentaseBesok) < 0;

  const displayPrediksiBesok = prediksiBesokSeries && prediksiBesokSeries.length > 0
    ? prediksiBesokSeries[0] 
    : null;

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    {/* --- Title Dashboard --- */}
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Prediksi Harga Beras
          </h1>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* --- Section Input Parameters --- */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          Parameter Prediksi
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pilihan Jenis Beras */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Jenis Beras</label>
            <select
              name="jenisBeras"
              id="jenisBeras"
              value={jenisBeras}
              onChange={(e) => setJenisBeras(e.target.value as keyof HargaData)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="" disabled hidden>
                Pilih Jenis Beras
              </option>
              <option value="medium_silinda">Beras Medium Silinda</option>
              <option value="premium_silinda">Beras Premium Silinda</option>
              <option value="medium_bapanas">Beras Medium Bapanas</option>
              <option value="premium_bapanas">Beras Premium Bapanas</option>
            </select>
          </div>

          {/* Pilihan Model Prediksi */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Model Prediksi</label>
            <select
              name="model"
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value as 'ARIMA' | 'LSTM')}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="ARIMA">ARIMA</option>
              <option value="LSTM">LSTM</option>
            </select>
          </div>

          {/* Pilihan Periode Prediksi Khusus */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Periode Prediksi</label>
            <select
              name="periode"
              id="periode"
              value={periodePrediksi}
              onChange={(e) => setPeriodePrediksi(e.target.value as '' | 'IdulFitri' | 'TahunBaru')}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <option value="" disabled hidden>
                Pilih Periode Prediksi
              </option>
              <option value="IdulFitri">Mendekati Lebaran Idul Fitri</option>
              <option value="TahunBaru">Mendekati Tahun Baru</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Loading & Error States --- */}
      {loadingHistorical && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-gray-600 font-medium">Memuat data harga terkini...</span>
            </div>
          </div>
        </div>
      )}

      {errorHistorical && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 font-medium">Error: {errorHistorical}</p>
            </div>
          </div>
        </div>
      )}

      {/* --- Price Information Cards --- */}
      {!loadingHistorical && !errorHistorical && (
        <>
          {/* Current Price Card */}
          {jenisBeras && hargaHariIni[jenisBeras] !== undefined ? (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">Harga Saat Ini</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {formatJenisBerasName(jenisBeras as string)}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    Rp {hargaHariIni[jenisBeras]?.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path fill="#2563EB" d="M3.5 18.5L2 17l7.5-7.5l4 4l7.1-8L22 6.9l-8.5 9.6l-4-4z"/>
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <p className="text-gray-500">Pilih jenis beras untuk melihat harga saat ini.</p>
              </div>
            </div>
          )}

          {/* Tomorrow Prediction Card */}
          {jenisBeras && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">Prediksi Harga Besok</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Model {model}
                  </p>
                  <div className="mb-3">
                    {loadingPrediksiBesok && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                        <span className="text-gray-600">Memuat...</span>
                      </div>
                    )}
                    {errorPrediksiBesok && (
                      <p className="text-red-500 font-medium">{errorPrediksiBesok}</p>
                    )}
                    {!loadingPrediksiBesok && !errorPrediksiBesok && displayPrediksiBesok !== null && (
                      <p className="text-3xl font-bold text-gray-900">
                        Rp {displayPrediksiBesok.toLocaleString('id-ID')}
                      </p>
                    )}
                    {!loadingPrediksiBesok && !errorPrediksiBesok && displayPrediksiBesok === null && (
                      <p className="text-3xl font-bold text-gray-400">-</p>
                    )}
                  </div>
                  {/* Price Change Indicator */}
                  <div>
                    {persentaseBesok !== null ? (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isNaikBesok
                          ? 'bg-green-100 text-green-800'
                          : isTurunBesok
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isNaikBesok && (
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        )}
                        {isTurunBesok && (
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                          </svg>
                        )}
                        {isNaikBesok && '+'}{persentaseBesok}% dari hari ini
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        {jenisBeras ? 'Data perubahan tidak tersedia' : 'Pilih jenis beras untuk melihat perubahan'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-full p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path fill="#16A34A" d="M17 20q-.425 0-.712-.288T16 19v-5q0-.425.288-.712T17 13h2q.425 0 .713.288T20 14v5q0 .425-.288.713T19 20zm-6 0q-.425 0-.712-.288T10 19V5q0-.425.288-.712T11 4h2q.425 0 .713.288T14 5v14q0 .425-.288.713T13 20zm-6 0q-.425 0-.712-.288T4 19v-9q0-.425.288-.712T5 9h2q.425 0 .713.288T8 10v9q0 .425-.288.713T7 20z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Special Period Predictions */}
          {jenisBeras && periodePrediksi === 'IdulFitri' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Prediksi Mendekati Idul Fitri
              </h3>
              <IdulFitriPred
                jenisBeras={jenisBeras}
                model={model}
                hargaHariIni={hargaHariIni}
                onPredictionResult={setChartPredictionIdulFitriSeries} 
              />
            </div>
          )}

          {jenisBeras && periodePrediksi === 'TahunBaru' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Prediksi Mendekati Tahun Baru
              </h3>
              <NewYearPred
                jenisBeras={jenisBeras}
                model={model}
                hargaHariIni={hargaHariIni}
                onPredictionResult={setChartPredictionNewYearSeries} 
              />
            </div>
          )}

          {/* Message when no special period selected */}
          {jenisBeras && !periodePrediksi && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Pilih periode prediksi seperti "Idul Fitri" atau "Tahun Baru" untuk melihat prediksi spesifik.</p>
              </div>
            </div>
          )}
          
          {/* Chart Visualization */}
          {jenisBeras && allHistoricalDataLocal.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Grafik Prediksi Harga
              </h3>
              <PriceChart
                historicalData={allHistoricalDataLocal}
                jenisBeras={jenisBeras as string}
                predictionTomorrowSeries={prediksiBesokSeries}
                predictionNewYearSeries={chartPredictionNewYearSeries}
                predictionIdulFitriSeries={chartPredictionIdulFitriSeries}
                periodePrediksi={periodePrediksi} 
                predictionTomorrow={null}              
              />
            </div>
          )}
          
          {/* No historical data message */}
          {jenisBeras && allHistoricalDataLocal.length === 0 && !loadingHistorical && !errorHistorical && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Tidak ada data historis yang tersedia untuk grafik.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
};

export default Prediksi;