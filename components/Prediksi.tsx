// beras-frontend/components/Prediksi.tsx
'use client'; 

import React, { useState, useEffect, useCallback } from "react"; 
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

// --- BARU: Mapping untuk Nama Tampilan Kategori Beras ---
const riceCategoryDisplayNames: Record<keyof HargaData, string> = {
  medium_silinda: "Beras Medium Silinda",
  premium_silinda: "Beras Premium Silinda",
  medium_bapanas: "Beras Medium Bapanas",
  premium_bapanas: "Beras Premium Bapanas",
};

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
  }, []); 

  useEffect(() => {
    fetchLocalHistoricalData();
  }, [fetchLocalHistoricalData]); 

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

  const persentaseBesok = hitungPersentasePerubahanBesok();
  const isNaikBesok = persentaseBesok !== null && Number(persentaseBesok) > 0;
  const isTurunBesok = persentaseBesok !== null && Number(persentaseBesok) < 0;

  const displayPrediksiBesok = prediksiBesokSeries && prediksiBesokSeries.length > 0
    ? prediksiBesokSeries[0] 
    : null;

  // --- BARU: Fungsi helper untuk mendapatkan nama tampilan ---
  const getDisplayName = (category: keyof HargaData) => {
    return riceCategoryDisplayNames[category] || category.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-10"> 
      {/* Title Bar Aplikasi (sticky di bagian atas) */}
      <div className="shadow-md h-15 bg-white sticky top-0 z-10 flex items-center">
        <span className="h-full w-full flex items-center font-sans font-bold text-lg text-gray-900 ml-5 py-4">
          Prediksi Harga Beras
        </span>
      </div>

      {/* Bagian Input Pengguna (dropdowns untuk Jenis Beras, Model, Periode Prediksi) */}
      <div className="mt-10 px-10 flex flex-col gap-8">
        {/* Pilihan Jenis Beras */}
        <div className="flex flex-col">
          <span className="font-bold font-sans text-lg mb-2 text-gray-700">Jenis Beras</span>
          <select
            name="jenisBeras"
            id="jenisBeras"
            value={jenisBeras}
            onChange={(e) => setJenisBeras(e.target.value as keyof HargaData)}
            className="w-full md:w-2/3 lg:w-1/2 h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-base shadow-sm"
          >
            <option value="" disabled hidden>
              Pilih Jenis Beras
            </option>
            {/* Menggunakan nilai kategori sebagai value, dan display name sebagai label */}
            {Object.keys(riceCategoryDisplayNames).map(key => (
                <option key={key} value={key}>
                    {riceCategoryDisplayNames[key as keyof HargaData]}
                </option>
            ))}
          </select>
        </div>

        {/* Pilihan Model Prediksi */}
        <div className="flex flex-col">
          <span className="font-bold font-sans text-lg mb-2 text-gray-700">Model Prediksi</span>
          <select
            name="model"
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value as 'ARIMA' | 'LSTM')}
            className="w-full md:w-2/3 lg:w-1/2 h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-base shadow-sm"
          >
            <option value="ARIMA">ARIMA</option>
            <option value="LSTM">LSTM</option>
          </select>
        </div>

        {/* Pilihan Periode Prediksi Khusus */}
        <div className="flex flex-col">
          <span className="font-bold font-sans text-lg mb-2 text-gray-700">Periode Prediksi</span>
          <select
            name="periode"
            id="periode"
            value={periodePrediksi}
            onChange={(e) => setPeriodePrediksi(e.target.value as '' | 'IdulFitri' | 'TahunBaru')}
            className="w-full md:w-2/3 lg:w-1/2 h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-base shadow-sm"
          >
            <option value="" disabled hidden>
              Pilih Periode Prediksi
            </option>
            <option value="IdulFitri">Mendekati Lebaran Idul Fitri</option>
            <option value="TahunBaru">Mendekati Tahun Baru</option>
          </select>
        </div>
      </div>

      {/* Area Visualisasi Hasil Prediksi (Kotak Harga dan Grafik) */}
      <div className="mt-10 px-10 pb-10 flex flex-col items-center justify-center gap-8">
        {/* Menampilkan status loading atau error saat memuat data historis */}
        {loadingHistorical && (
          <p className="text-gray-600">Memuat data harga terkini...</p>
        )}
        {errorHistorical && (
          <p className="text-red-500">Error: {errorHistorical}</p>
        )}

        {/* Jika data historis sudah dimuat (atau ada error yang tidak memblokir) */}
        {!loadingHistorical && !errorHistorical && (
          <>
            {/* Kotak "Harga Saat Ini" */}
            {jenisBeras && hargaHariIni[jenisBeras] !== undefined ? (
                 <div className="flex w-full md:w-9/10 p-5 border border-gray-200 rounded-xl bg-white shadow-md justify-between items-center">
                    <div>
                        <div className="font-sans text-md text-gray-500 mb-2">
                            Harga Saat Ini ({getDisplayName(jenisBeras)}) {/* Perbaikan di sini */}
                        </div>
                        <div className="font-bold text-2xl text-gray-900">
                            {`Rp ${hargaHariIni[jenisBeras]?.toLocaleString('id-ID')}`}
                        </div>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
                            <path fill="#2563EB" d="M3.5 18.5L2 17l7.5-7.5l4 4l7.1-8L22 6.9l-8.5 9.6l-4-4z"/>
                        </svg>
                    </div>
                </div>
            ) : (
                <p className="text-gray-500 text-center">Pilih jenis beras untuk melihat harga saat ini.</p>
            )}

            {/* Kotak "Prediksi Harga Besok" */}
            {jenisBeras && (
                 <div className="w-full md:w-9/10 p-5 border border-gray-200 rounded-xl bg-white shadow-md flex justify-between items-center">
                    <div>
                        <div className="font-sans text-md text-gray-500 mb-2">
                            Prediksi Harga Besok Model {model}
                        </div>
                        <div className="font-bold text-2xl text-gray-900">
                            {loadingPrediksiBesok && 'Memuat...'}
                            {errorPrediksiBesok && <span className="text-red-500">{errorPrediksiBesok}</span>}
                            {!loadingPrediksiBesok &&
                                !errorPrediksiBesok &&
                                displayPrediksiBesok !== null &&
                                `Rp ${displayPrediksiBesok.toLocaleString('id-ID')}`}
                            {!loadingPrediksiBesok && !errorPrediksiBesok && displayPrediksiBesok === null && '-'}
                        </div>
                        {/* Keterangan naik/turun dari hari ini */}
                        <div>
                            {persentaseBesok !== null ? (
                                <p
                                    className={`text-sm font-sans ${
                                        isNaikBesok
                                            ? 'text-green-600'
                                            : isTurunBesok
                                            ? 'text-red-600'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {isNaikBesok && '↗ +'}{isTurunBesok && '↘ '}{persentaseBesok}% dari hari ini
                                </p>
                            ) : (
                                <p className="text-gray-500 text-sm font-sans">
                                    {jenisBeras ? 'Data perubahan tidak tersedia' : 'Pilih jenis beras untuk melihat perubahan'}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
                            <path fill="#16A34A" d="M17 20q-.425 0-.712-.288T16 19v-5q0-.425.288-.712T17 13h2q.425 0 .713.288T20 14v5q0 .425-.288.713T19 20zm-6 0q-.425 0-.712-.288T10 19V5q0-.425.288-.712T11 4h2q.425 0 .713.288T14 5v14q0 .425-.288.713T13 20zm-6 0q-.425 0-.712-.288T4 19v-9q0-.425.288-.712T5 9h2q.425 0 .713.288T8 10v9q0 .425-.288.713T7 20z"/>
                        </svg>
                    </div>
                </div>
            )}

            {/* Kotak Prediksi Periode Khusus (Idul Fitri / Tahun Baru) */}
            {jenisBeras && periodePrediksi === 'IdulFitri' && (
              <IdulFitriPred
                jenisBeras={jenisBeras}
                model={model}
                hargaHariIni={hargaHariIni}
                onPredictionResult={setChartPredictionIdulFitriSeries} 
              />
            )}

            {jenisBeras && periodePrediksi === 'TahunBaru' && (
              <NewYearPred
                jenisBeras={jenisBeras}
                model={model}
                hargaHariIni={hargaHariIni}
                onPredictionResult={setChartPredictionNewYearSeries} 
              />
            )}

            {/* Pesan jika pengguna belum memilih periode khusus */}
            {jenisBeras && !periodePrediksi && (
              <p className="text-gray-500 text-center">Pilih periode prediksi seperti &#34;Idul Fitri&#34; atau &#34;Tahun Baru&#34; untuk melihat prediksi spesifik.</p> 
            )}
            
            {/* Visualisasi Grafis di Paling Bawah */}
            {jenisBeras && allHistoricalDataLocal.length > 0 && (
              <PriceChart
                historicalData={allHistoricalDataLocal}
                jenisBeras={jenisBeras}
                predictionTomorrowSeries={prediksiBesokSeries} 
                predictionNewYearSeries={chartPredictionNewYearSeries} 
                predictionIdulFitriSeries={chartPredictionIdulFitriSeries} 
                periodePrediksi={periodePrediksi}
              />
            )}
            
            {/* Pesan jika tidak ada data historis untuk grafik */}
            {jenisBeras && allHistoricalDataLocal.length === 0 && !loadingHistorical && !errorHistorical && (
                <p className="text-gray-500 text-center">Tidak ada data historis yang tersedia untuk grafik.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Prediksi;