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
    <div>
      {/* Dashboard Title */}
      <div className="shadow-md h-15 bg-white">
        <span className="h-full w-full flex items-center font-sans font-bold text-lg text-gray-900 ml-5">
          Dashboard Prediksi Harga Beras
        </span>
      </div>

      {/* Pilihan Jenis Beras & Model */}
      <div className="flex h-20 justify-between px-32 mt-5">
        <div className="flex flex-col">
          <span className="text-center font-sans">Jenis Beras</span>
          <select
            name="jenisBeras"
            id="jenisBeras"
            value={jenisBeras}
            onChange={(e) => setJenisBeras(e.target.value as keyof HargaData)}
            className="w-100 h-10 px-4 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
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

        <div className="flex flex-col">
          <span className="text-center font-sans">Model</span>
          <select
            name="model"
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value as 'ARIMA' | 'LSTM')}
            className="w-100 h-10 px-4 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
          >
            <option value="ARIMA">ARIMA</option>
            <option value="LSTM">LSTM</option>
          </select>
        </div>
      </div>

      {/* Dashboard Boxes */}
      <div className="w-full h-full py-10 flex flex-col items-center justify-center gap-10">
        {/* Harga Saat Ini */}
        <div className="flex w-9/10 h-30 border border-gray-200 rounded-2xl bg-gray-100 px-5 justify-between items-center">
          <div>
            <div className="font-sans text-md text-gray-500 mb-2">
              Harga Saat Ini
            </div>
            <div className="font-bold text-xl">
              {jenisBeras && hargaHariIni[jenisBeras] !== undefined
                ? `Rp ${hargaHariIni[jenisBeras]?.toLocaleString('id-ID')}`
                : '-'}
            </div>
          </div>
          <div className="bg-blue-300 rounded-md w-min h-min">
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24">
              <path fill="#1D4ED8" d="M3.5 18.5L2 17l7.5-7.5l4 4l7.1-8L22 6.9l-8.5 9.6l-4-4z"/>
            </svg>
          </div>
        </div>

        {/* Prediksi Harga Besok */}
        <div className="w-9/10 h-30 border border-gray-200 rounded-2xl bg-gray-100 px-5 flex justify-between items-center">
          <div>
            <div className="font-sans text-md text-gray-500 mb-2">
              Prediksi Harga Besok Model {model}
            </div>
            <div className="font-bold text-xl">
              {loading && 'Memuat...'}
              {error && <span className="text-red-500">{error}</span>}
              {!loading &&
                !error &&
                prediksi !== null &&
                `Rp ${prediksi.toLocaleString('id-ID')}`}
              {!loading && !error && prediksi === null && !jenisBeras && '-'}
            </div>
            {/* Keterangan naik/turun dari hari ini */}
            <div>
              {persentase !== null ? (
                <p
                  className={`text-sm font-sans ${
                    isNaik
                      ? 'text-green-600'
                      : isTurun
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {isNaik && '↗ +'}{isTurun && '↘ '}{persentase}% dari hari ini
                </p>
              ) : (
                <p className="text-gray-500 text-sm font-sans">
                  {jenisBeras ? 'Data perubahan tidak tersedia' : 'Pilih jenis beras untuk melihat perubahan'}
                </p>
              )}
            </div>
          </div>
          <div className="bg-green-300 rounded-md w-min h-min ">
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24">
              <path fill="#15803D" d="M17 20q-.425 0-.712-.288T16 19v-5q0-.425.288-.712T17 13h2q.425 0 .713.288T20 14v5q0 .425-.288.713T19 20zm-6 0q-.425 0-.712-.288T10 19V5q0-.425.288-.712T11 4h2q.425 0 .713.288T14 5v14q0 .425-.288.713T13 20zm-6 0q-.425 0-.712-.288T4 19v-9q0-.425.288-.712T5 9h2q.425 0 .713.288T8 10v9q0 .425-.288.713T7 20z"/>
            </svg>
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
};

export default Dashboard;