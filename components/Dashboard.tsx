// beras-frontend/components/Dashboard.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  predictMediumSilindaArima,
  predictMediumSilindaLstm,
  predictPremiumSilindaArima,
  predictPremiumSilindaLstm,
  predictMediumBapanasArima,
  predictMediumBapanasLstm,
  predictPremiumBapanasArima,
  predictPremiumBapanasLstm,
} from '../utils/api';
import NewYearPred from './NewYearPred'; // Komponen contoh lainnya
import IdulFitriPred from './IdulFitriPred';

// --- Interfaces ---
type HargaData = {
  [key: string]: number | undefined;
};

// Interface untuk data historis dari public/data_harga.json (hanya untuk harga hari ini/kemarin)
interface HistoricalPriceData {
  id: number;
  date: string;
  medium_silinda: number;
  premium_silinda: number;
  medium_bapanas: number;
  premium_bapanas: number;
}

const Dashboard = () => {
  // --- States ---
  const [jenisBeras, setJenisBeras] = useState<keyof HargaData>('');
  const [model, setModel] = useState<'ARIMA' | 'LSTM'>('ARIMA');
  const [prediksi, setPrediksi] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hargaHariIni, setHargaHariIni] = useState<HargaData>({});
  const [hargaKemarin, setHargaKemarin] = useState<HargaData>({});
  // `allHistoricalData` hanya untuk mengambil harga hari ini/kemarin dari file lokal
  const [allHistoricalDataLocal, setAllHistoricalDataLocal] = useState<HistoricalPriceData[]>([]);

  // --- Efek: Mengambil Data Historis Lokal (untuk harga Hari Ini & Kemarin) ---
  useEffect(() => {
    const fetchLocalHistoricalData = async () => {
      try {
        const res = await fetch('/data_harga.json'); // Mengambil dari file JSON lokal di public/
        if (!res.ok) {
            throw new Error('Gagal memuat data historis lokal.');
        }

        const dataArray: HistoricalPriceData[] = await res.json();
        setAllHistoricalDataLocal(dataArray); // Simpan semua data historis lokal

        if (dataArray.length >= 2) {
          const latestData = dataArray[dataArray.length - 1];
          const yesterdayData = dataArray[dataArray.length - 2];

          setHargaHariIni({
            medium_silinda: latestData.medium_silinda,
            premium_silinda: latestData.premium_silinda,
            medium_bapanas: latestData.medium_bapanas,
            premium_bapanas: latestData.premium_bapanas,
          });

          setHargaKemarin({
            medium_silinda: yesterdayData.medium_silinda,
            premium_silinda: yesterdayData.premium_silinda,
            medium_bapanas: yesterdayData.medium_bapanas,
            premium_bapanas: yesterdayData.premium_bapanas,
          });
        } else {
            setError('Data historis lokal tidak cukup untuk harga hari ini dan kemarin.');
        }
      } catch (err: any) {
        console.error('Error fetching local historical prices:', err);
        setError(`Gagal memuat harga terkini dari lokal: ${err.message || 'Terjadi kesalahan.'}`);
      }
    };

    fetchLocalHistoricalData();
  }, []);

  // --- Efek: Mengambil Prediksi dari Backend ---
  // Dipicu oleh perubahan jenisBeras, model, atau setelah data historis lokal untuk UI dimuat.
  useEffect(() => {
    const fetchPrediction = async () => {
      // Tunggu hingga jenisBeras dipilih dan harga hari ini tersedia (dari data lokal)
      if (!jenisBeras || Object.keys(hargaHariIni).length === 0) {
        setPrediksi(null);
        setError('Pilih jenis beras dan tunggu data harga lokal dimuat.');
        return;
      }

      setLoading(true);
      setError('');
      setPrediksi(null);

      try {
        let predictionResult: number[] = [];
        const stepsAhead = 1; // Untuk prediksi harga besok

        // Panggil fungsi API yang sesuai, tanpa meneruskan `last_values`
        switch (jenisBeras) {
          case 'medium_silinda':
            predictionResult =
              model === 'ARIMA'
                ? await predictMediumSilindaArima(stepsAhead)
                : await predictMediumSilindaLstm(stepsAhead);
            break;
          case 'premium_silinda':
            predictionResult =
              model === 'ARIMA'
                ? await predictPremiumSilindaArima(stepsAhead)
                : await predictPremiumSilindaLstm(stepsAhead);
            break;
          case 'medium_bapanas':
            predictionResult =
              model === 'ARIMA'
                ? await predictMediumBapanasArima(stepsAhead)
                : await predictMediumBapanasLstm(stepsAhead);
            break;
          case 'premium_bapanas':
            predictionResult =
              model === 'ARIMA'
                ? await predictPremiumBapanasArima(stepsAhead)
                : await predictPremiumBapanasLstm(stepsAhead);
            break;
          default:
            setError('Jenis beras tidak valid.');
            setLoading(false);
            return;
        }

        if (predictionResult.length > 0) {
          setPrediksi(predictionResult[0]);
        } else {
          setError('API tidak mengembalikan hasil prediksi.');
        }
      } catch (err: any) {
        console.error('Error fetching prediction:', err);
        setError(`Gagal mengambil prediksi: ${err.message || 'Terjadi kesalahan tidak diketahui.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [jenisBeras, model, hargaHariIni]); // `hargaHariIni` sebagai dependensi untuk memicu fetch prediksi

  // --- Fungsi: Hitung Persentase Perubahan ---
  const hitungPersentasePerubahan = () => {
    if (
      jenisBeras &&
      prediksi !== null &&
      hargaHariIni[jenisBeras] !== undefined &&
      hargaHariIni[jenisBeras] !== 0
    ) {
      const hargaSekarang = hargaHariIni[jenisBeras] as number;
      const hargaPrediksi = prediksi;
      const perubahan = ((hargaPrediksi - hargaSekarang) / hargaSekarang) * 100;
      return perubahan.toFixed(2);
    }
    return null;
  };

  const persentase = hitungPersentasePerubahan();
  const isNaik = persentase !== null && Number(persentase) > 0;
  const isTurun = persentase !== null && Number(persentase) < 0;

return (
  <div className="bg-gray-50 min-h-screen">
    {/* Dashboard Title */}
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="h-16 flex items-center px-6">
        <h1 className="text-xl font-bold text-gray-800 font-sans">
          Dashboard Prediksi Harga Beras
        </h1>
      </div>
    </div>

    {/* Pilihan Jenis Beras & Model */}
    <div className="bg-white mx-6 mt-6 p-6 rounded-xl shadow-md border border-gray-200">
      <div className="flex justify-between items-end gap-8">
        <div className="flex flex-col flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 font-sans">
            Jenis Beras
          </label>
          <select
            name="jenisBeras"
            id="jenisBeras"
            value={jenisBeras}
            onChange={(e) => setJenisBeras(e.target.value as keyof HargaData)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-sans shadow-sm"
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

        <div className="flex flex-col flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 font-sans">
            Model Prediksi
          </label>
          <select
            name="model"
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value as 'ARIMA' | 'LSTM')}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-sans shadow-sm"
          >
            <option value="ARIMA">ARIMA</option>
            <option value="LSTM">LSTM</option>
          </select>
        </div>
      </div>
    </div>

    {/* Dashboard Cards */}
    <div className="px-6 py-6 space-y-6">
      {/* Harga Saat Ini */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#3B82F6" d="M3.5 18.5L2 17l7.5-7.5l4 4l7.1-8L22 6.9l-8.5 9.6l-4-4z"/>
                </svg>
              </div>
              <h3 className="font-sans text-lg font-semibold text-gray-800">
                Harga Saat Ini
              </h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {jenisBeras && hargaHariIni[jenisBeras] !== undefined
                ? `Rp ${hargaHariIni[jenisBeras]?.toLocaleString('id-ID')}`
                : 'Pilih jenis beras'}
            </div>
            <p className="text-sm text-gray-500 mt-2 font-sans">
              Harga berdasarkan data terkini
            </p>
          </div>
        </div>
      </div>

      {/* Prediksi Harga Besok */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#10B981" d="M17 20q-.425 0-.712-.288T16 19v-5q0-.425.288-.712T17 13h2q.425 0 .713.288T20 14v5q0 .425-.288.713T19 20zm-6 0q-.425 0-.712-.288T10 19V5q0-.425.288-.712T11 4h2q.425 0 .713.288T14 5v14q0 .425-.288.713T13 20zm-6 0q-.425 0-.712-.288T4 19v-9q0-.425.288-.712T5 9h2q.425 0 .713.288T8 10v9q0 .425-.288.713T7 20z"/>
                </svg>
              </div>
              <h3 className="font-sans text-lg font-semibold text-gray-800">
                Prediksi Harga Besok - Model {model}
              </h3>
            </div>
            
            <div className="text-3xl font-bold text-gray-900 mb-3">
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                  <span className="text-lg text-emerald-600">Memuat prediksi...</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <span className="text-red-600 text-base font-medium">{error}</span>
                </div>
              )}
              {!loading &&
                !error &&
                prediksi !== null &&
                `Rp ${prediksi.toLocaleString('id-ID')}`}
              {!loading && !error && prediksi === null && !jenisBeras && 'Pilih jenis beras'}
            </div>
            
            {/* Keterangan naik/turun dari hari ini */}
            <div className="mt-3">
              {persentase !== null ? (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isNaik
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : isTurun
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {isNaik && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                  {isTurun && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                  <span>
                    {isNaik && '+'}{persentase}% dari hari ini
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 text-sm font-sans bg-gray-50 px-3 py-2 rounded-lg inline-block">
                  {jenisBeras ? 'Data perubahan tidak tersedia' : 'Pilih jenis beras untuk melihat perubahan'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prediksi Untuk Tanggal Tahun Baru - Menggunakan Komponen Terpisah */}
      <NewYearPred
        jenisBeras={jenisBeras}
        model={model}
        hargaHariIni={hargaHariIni}
      />
      <IdulFitriPred
        jenisBeras={jenisBeras}
        model={model}
        hargaHariIni={hargaHariIni}
      />
    </div>
  </div>
);

}

export default Dashboard;