// beras-frontend/components/Perbandingan.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Impor useCallback
import {
  predictMediumSilindaArima,
  predictMediumSilindaLstm,
  predictPremiumSilindaArima,
  predictPremiumSilindaLstm,
  predictMediumBapanasArima,
  predictMediumBapanasLstm,
  predictPremiumBapanasArima,
  predictPremiumBapanasLstm,
} from '../utils/api'; // Menggunakan API yang sudah diubah untuk JSON lokal

// --- Interfaces ---
type RiceCategory = 'medium_silinda' | 'premium_silinda' | 'medium_bapanas' | 'premium_bapanas';

interface HistoricalPriceData {
  id: number;
  date: string;
  medium_silinda: number;
  premium_silinda: number;
  medium_bapanas: number;
  premium_bapanas: number;
}

interface ComparisonRowData {
  category: RiceCategory;
  displayName: string;
  currentPrice: number | null;
  predictionArima: number | null;
  predictionLstm: number | null;
  trend: 'Naik' | 'Turun' | 'Stabil' | 'N/A';
  loading: boolean;
  error: string | null;
}

const Perbandingan: React.FC = () => {
  const [comparisonData, setComparisonData] = useState<ComparisonRowData[]>([]);
  const [allHistoricalData, setAllHistoricalData] = useState<HistoricalPriceData[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // riceCategories didefinisikan di luar render cycle, jadi stabil
  const riceCategories: { category: RiceCategory; displayName: string }[] = [
    { category: 'medium_silinda', displayName: 'Beras Medium Silinda' },
    { category: 'premium_silinda', displayName: 'Beras Premium Silinda' },
    { category: 'medium_bapanas', displayName: 'Beras Medium Bapanas' },
    { category: 'premium_bapanas', displayName: 'Beras Premium Bapanas' },
  ];

  // Helper function untuk mendapatkan fungsi prediksi yang tepat (dibungkus useCallback)
  const getPredictionFunctions = useCallback((category: RiceCategory) => {
    switch (category) {
      case 'medium_silinda':
        return { arima: predictMediumSilindaArima, lstm: predictMediumSilindaLstm };
      case 'premium_silinda':
        return { arima: predictPremiumSilindaArima, lstm: predictPremiumSilindaLstm };
      case 'medium_bapanas':
        return { arima: predictMediumBapanasArima, lstm: predictMediumBapanasLstm };
      case 'premium_bapanas':
        return { arima: predictPremiumBapanasArima, lstm: predictPremiumBapanasLstm };
      default:
        // Fallback, seharusnya tidak tercapai jika `category` selalu valid
        return { arima: predictMediumSilindaArima, lstm: predictMediumSilindaLstm }; 
    }
  }, []); // Dependensi kosong karena argumen stabil dan tidak menggunakan scope luar

  // --- Mengambil Data Historis ---
  useEffect(() => {
    const fetchLocalHistoricalData = async () => {
      try {
        setGlobalLoading(true);
        const res = await fetch('/data_harga.json');
        if (!res.ok) {
          throw new Error('Gagal memuat data historis lokal.');
        }
        const dataArray: HistoricalPriceData[] = await res.json();
        setAllHistoricalData(dataArray);
      } catch (err: unknown) { // Menggunakan 'unknown'
        if (err instanceof Error) {
            setGlobalError(`Gagal memuat data historis lokal: ${err.message}`);
        } else {
            setGlobalError('Gagal memuat data historis lokal: Terjadi kesalahan tidak diketahui.');
        }
      } finally {
        setGlobalLoading(false);
      }
    };
    fetchLocalHistoricalData();
  }, []);

  // --- Mengambil Data Perbandingan (sekarang dari JSON prediksi lokal) ---
  const fetchComparisonData = useCallback(async () => { // Dibungkus useCallback
    if (allHistoricalData.length === 0) return;

    const todayPriceIndex = allHistoricalData.length - 1;
    if (todayPriceIndex < 0) {
      setGlobalError('Data historis tidak mencukupi.');
      return;
    }
    
    const latestData = allHistoricalData[todayPriceIndex];

    const initialComparisonData: ComparisonRowData[] = riceCategories.map((item) => ({
      category: item.category,
      displayName: item.displayName,
      currentPrice: latestData[item.category] as number,
      predictionArima: null,
      predictionLstm: null,
      trend: 'N/A',
      loading: true,
      error: null,
    }));
    setComparisonData(initialComparisonData);

    const stepsAhead = 1; // Selalu memprediksi untuk hari besok

    const promises = riceCategories.map(async ({ category, displayName }) => {
      try {
        const { arima: arimaPredict, lstm: lstmPredict } = getPredictionFunctions(category);

        const [arimaResult, lstmResult] = await Promise.all([
          arimaPredict(stepsAhead),
          lstmPredict(stepsAhead)
        ]);

        const currentPrice = latestData[category] as number;
        const arimaPredValue = arimaResult.length > 0 ? arimaResult[0] : null;
        const lstmPredValue = lstmResult.length > 0 ? lstmResult[0] : null;

        let trend: 'Naik' | 'Turun' | 'Stabil' | 'N/A' = 'N/A';
        const avgPrediction = 
          (arimaPredValue !== null && lstmPredValue !== null) ? (arimaPredValue + lstmPredValue) / 2 :
          (arimaPredValue !== null) ? arimaPredValue :
          (lstmPredValue !== null) ? lstmPredValue : null;

        if (currentPrice && avgPrediction !== null) {
          const threshold = currentPrice * 0.01; 
          if (avgPrediction > currentPrice + threshold) trend = 'Naik';
          else if (avgPrediction < currentPrice - threshold) trend = 'Turun';
          else trend = 'Stabil';
        }

        return {
          category,
          predictionArima: arimaPredValue,
          predictionLstm: lstmPredValue,
          trend,
          loading: false,
          error: null,
        };
      } catch (err: unknown) { // Menggunakan 'unknown'
        console.error(`Error fetching prediction for ${displayName}:`, err);
        let errorMessage = 'Error tidak diketahui.';
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        return {
          category,
          predictionArima: null,
          predictionLstm: null,
          trend: 'N/A' as const,
          loading: false,
          error: `Gagal prediksi: ${errorMessage}`,
        };
      }
    });

    const results = await Promise.all(promises);

    setComparisonData((prevData) =>
      prevData.map((row) => {
        const result = results.find(r => r.category === row.category);
        return result ? { ...row, ...result } : row;
      })
    );
  }, [allHistoricalData, riceCategories, getPredictionFunctions]); // Tambahkan dependensi

  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]); // fetchComparisonData dibungkus useCallback, jadi aman

  return (
    <div className="my-20 mx-5 p-5 bg-white shadow-lg rounded-lg">
      <h1 className="font-sans font-bold text-center text-2xl mb-8 text-gray-800">
        Perbandingan Harga Semua Jenis Beras
      </h1>
      
      {globalLoading && (
        <p className="text-center text-blue-600 text-lg">Memuat data perbandingan...</p>
      )}
      
      {globalError && (
        <p className="text-center text-red-600 text-lg">Error: {globalError}</p>
      )}

      {!globalLoading && !globalError && comparisonData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Beras
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Saat Ini
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prediksi ARIMA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prediksi LSTM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparisonData.map((row) => (
                <tr key={row.category} className="odd:bg-gray-50 even:bg-white hover:bg-gray-100 transition-colors duration-150">
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">
                    {row.displayName}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {row.currentPrice !== null ? `Rp${row.currentPrice.toLocaleString('id-ID')}` : 'N/A'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {row.loading ? (
                      <span className="text-blue-500">Memuat...</span>
                    ) : row.error ? (
                      <span className="text-red-500" title={row.error}>Error</span>
                    ) : row.predictionArima !== null ? (
                      `Rp${Math.round(row.predictionArima).toLocaleString('id-ID')}`
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                    {row.loading ? (
                      <span className="text-blue-500">Memuat...</span>
                    ) : row.error ? (
                      <span className="text-red-500" title={row.error}>Error</span>
                    ) : row.predictionLstm !== null ? (
                      `Rp${Math.round(row.predictionLstm).toLocaleString('id-ID')}`
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td
                    className={`px-4 py-2 whitespace-nowrap font-semibold ${
                      row.trend === 'Naik'
                        ? 'text-green-600'
                        : row.trend === 'Turun'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {row.trend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!globalLoading && !globalError && comparisonData.length === 0 && (
        <p className="text-center text-gray-500 text-lg">
          Tidak ada data perbandingan untuk ditampilkan.
        </p>
      )}
    </div>
  );
};

export default Perbandingan;