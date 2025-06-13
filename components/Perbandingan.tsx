// beras-frontend/components/Perbandingan.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  predictMediumSilindaArima, // Ini akan memanggil getLocalPrediction sekarang
  predictMediumSilindaLstm, // Ini akan memanggil getLocalPrediction sekarang
  predictPremiumSilindaArima,
  predictPremiumSilindaLstm,
  predictMediumBapanasArima,
  predictMediumBapanasLstm,
  predictPremiumBapanasArima,
  predictPremiumBapanasLstm,
} from '../utils/api'; // Pastikan path ini benar

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

  const riceCategories: { category: RiceCategory; displayName: string }[] = [
    { category: 'medium_silinda', displayName: 'Beras Medium Silinda' },
    { category: 'premium_silinda', displayName: 'Beras Premium Silinda' },
    { category: 'medium_bapanas', displayName: 'Beras Medium Bapanas' },
    { category: 'premium_bapanas', displayName: 'Beras Premium Bapanas' },
  ];

  // Helper function untuk mendapatkan fungsi prediksi yang tepat (tetap sama)
  const getPredictionFunctions = (category: RiceCategory) => {
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
  };

  // --- Mengambil Data Historis (tetap dari data_harga.json lokal) ---
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
      } catch (err: any) {
        setGlobalError(`Gagal memuat data historis lokal: ${err.message || 'Terjadi kesalahan.'}`);
      } finally {
        setGlobalLoading(false);
      }
    };
    fetchLocalHistoricalData();
  }, []);

  // --- Mengambil Data Perbandingan (sekarang dari JSON prediksi lokal) ---
  useEffect(() => {
    // Jalankan hanya jika data historis sudah dimuat
    if (allHistoricalData.length === 0) return;

    const fetchComparisonData = async () => {
      const todayPriceIndex = allHistoricalData.length - 1;
      if (todayPriceIndex < 0) {
        setGlobalError('Data historis tidak mencukupi.');
        return;
      }
      
      const latestData = allHistoricalData[todayPriceIndex]; // Harga hari ini

      // Inisialisasi data perbandingan dengan harga saat ini dan status loading
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

      // Buat array promises untuk mengambil prediksi secara paralel dari JSON lokal
      const promises = riceCategories.map(async ({ category, displayName }) => {
        try {
          // Tidak perlu lagi `last10Values` karena prediksi sudah di-pre-compute
          
          const { arima: arimaPredict, lstm: lstmPredict } = getPredictionFunctions(category);

          // Panggil prediksi secara paralel dari utils/api (yang kini baca JSON lokal)
          const [arimaResult, lstmResult] = await Promise.all([
            arimaPredict(stepsAhead), // Meminta 1 hari ke depan dari JSON
            lstmPredict(stepsAhead)   // Meminta 1 hari ke depan dari JSON
          ]);

          // Hitung trend
          const currentPrice = latestData[category] as number;
          const arimaPredValue = arimaResult.length > 0 ? arimaResult[0] : null;
          const lstmPredValue = lstmResult.length > 0 ? lstmResult[0] : null;

          let trend: 'Naik' | 'Turun' | 'Stabil' | 'N/A' = 'N/A';
          // Hitung rata-rata jika keduanya ada, atau gunakan salah satu jika yang lain null
          const avgPrediction = 
            (arimaPredValue !== null && lstmPredValue !== null) ? (arimaPredValue + lstmPredValue) / 2 :
            (arimaPredValue !== null) ? arimaPredValue :
            (lstmPredValue !== null) ? lstmPredValue : null;

          if (currentPrice && avgPrediction !== null) {
            const threshold = currentPrice * 0.01; // Toleransi 1% untuk dianggap "Stabil"
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
        } catch (err: any) {
          console.error(`Error fetching prediction for ${displayName}:`, err);
          return {
            category,
            predictionArima: null,
            predictionLstm: null,
            trend: 'N/A' as const,
            loading: false,
            error: `Gagal prediksi: ${err.message || 'Error tidak diketahui.'}`,
          };
        }
      });

      // Tunggu semua prediksi selesai
      const results = await Promise.all(promises);

      // Update state `comparisonData` dengan hasil prediksi
      setComparisonData((prevData) =>
        prevData.map((row) => {
          const result = results.find(r => r.category === row.category);
          return result ? { ...row, ...result } : row;
        })
      );
    };

    fetchComparisonData();
  }, [allHistoricalData]); // Bergantung pada allHistoricalData

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