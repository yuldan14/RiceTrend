// beras-frontend/components/NewYearPred.tsx
'use client'; 
import React, { useState, useEffect, useCallback } from 'react'; // Impor useCallback



type HargaData = {
  [key: string]: number | undefined;
};

interface NewYearPredProps {
  jenisBeras: keyof HargaData;
  model: 'ARIMA' | 'LSTM';
  hargaHariIni: HargaData;
  onPredictionResult?: (predictions: number[] | null) => void; 
}

const NewYearPred: React.FC<NewYearPredProps> = ({
  jenisBeras,
  model,
  hargaHariIni,
  onPredictionResult,
}) => {
  const [prediksiTahunBaruSeries, setPrediksiTahunBaruSeries] = useState<number[] | null>(null);
  const [loadingTahunBaru, setLoadingTahunBaru] = useState(false);
  const [errorTahunBaru, setErrorTahunBaru] = useState('');

  // Fungsi untuk menghitung berapa hari lagi menuju Tahun Baru berikutnya.
  // Dibungkus dengan useCallback karena digunakan di dalam useEffect.
  const hitungHariKeTahunBaru = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    let newYearDate = new Date(today.getFullYear() + 1, 0, 1); 

    if (newYearDate.getTime() <= today.getTime()) {
      newYearDate = new Date(today.getFullYear() + 2, 0, 1);
    }
    
    const diffTime = newYearDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, []); // Dependensi kosong karena tidak bergantung pada props/state

  // Fungsi untuk mengambil prediksi Tahun Baru dari API (sekarang dari JSON lokal).
  // Dibungkus dengan useCallback karena digunakan di dalam useEffect dan bergantung pada jenisBeras, model, hitungHariKeTahunBaru, onPredictionResult.
  const fetchPredictionTahunBaru = useCallback(async () => {
    if (!jenisBeras) {
      setPrediksiTahunBaruSeries(null);
      setErrorTahunBaru('Pilih jenis beras untuk melihat prediksi.');
      if (onPredictionResult) onPredictionResult(null); 
      setLoadingTahunBaru(false);
      return;
    }

    setLoadingTahunBaru(true);
    setErrorTahunBaru('');
    setPrediksiTahunBaruSeries(null); 
    if (onPredictionResult) onPredictionResult(null); 

    try {
      const stepsToNewYear = hitungHariKeTahunBaru();
      let predictionResult: number[] = [];

      // Menggunakan import dinamis untuk menghindari circular dependency
      const api = await import('../utils/api'); 

      switch (jenisBeras) {
        case 'medium_silinda':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictMediumSilindaArima(stepsToNewYear)
              : await api.predictMediumSilindaLstm(stepsToNewYear);
          break;
        case 'premium_silinda':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictPremiumSilindaArima(stepsToNewYear)
              : await api.predictPremiumSilindaLstm(stepsToNewYear);
          break;
        case 'medium_bapanas':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictMediumBapanasArima(stepsToNewYear)
              : await api.predictMediumBapanasLstm(stepsToNewYear);
          break;
        case 'premium_bapanas':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictPremiumBapanasArima(stepsToNewYear)
              : await api.predictPremiumBapanasLstm(stepsToNewYear);
          break;
        default:
          throw new Error('Jenis beras tidak valid.');
      }

      if (predictionResult.length > 0) {
        setPrediksiTahunBaruSeries(predictionResult); 
        if (onPredictionResult) onPredictionResult(predictionResult); 
      } else {
        setErrorTahunBaru('API tidak mengembalikan hasil prediksi.');
        if (onPredictionResult) onPredictionResult(null);
      }
    } catch (err: unknown) { // Menggunakan 'unknown' untuk tipe error yang lebih aman
      console.error('Error fetching new year prediction:', err);
      if (err instanceof Error) {
          setErrorTahunBaru(`Gagal mengambil prediksi tahun baru: ${err.message}`);
      } else {
          setErrorTahunBaru('Gagal mengambil prediksi tahun baru: Terjadi kesalahan tidak diketahui.');
      }
      if (onPredictionResult) onPredictionResult(null);
    } finally {
      setLoadingTahunBaru(false);
    }
  }, [jenisBeras, model, hitungHariKeTahunBaru, onPredictionResult]); // Tambahkan semua dependensi

  // Efek samping untuk memicu pengambilan prediksi setiap kali jenis beras atau model berubah.
  useEffect(() => {
    if (jenisBeras) {
      fetchPredictionTahunBaru();
    } else {
      setPrediksiTahunBaruSeries(null);
      setErrorTahunBaru('Pilih jenis beras.');
      if (onPredictionResult) onPredictionResult(null);
    }
  }, [jenisBeras, fetchPredictionTahunBaru, onPredictionResult]); // Tambahkan dependensi

  // Fungsi untuk menghitung persentase perubahan harga (menggunakan nilai terakhir dari deret prediksi)
  const hitungPersentasePerubahanTahunBaru = () => {
    const prediksiAkhir = prediksiTahunBaruSeries && prediksiTahunBaruSeries.length > 0
      ? prediksiTahunBaruSeries[prediksiTahunBaruSeries.length - 1]
      : null;

    if (
      jenisBeras &&
      prediksiAkhir !== null &&
      hargaHariIni[jenisBeras] !== undefined &&
      hargaHariIni[jenisBeras] !== 0
    ) {
      const hargaSekarang = hargaHariIni[jenisBeras] as number;
      const perubahan = ((prediksiAkhir - hargaSekarang) / hargaSekarang) * 100;
      return perubahan.toFixed(2);
    }
    return null;
  };

  const getTahunDepan = () => {
    const today = new Date();
    const newYearDateThisCycle = new Date(today.getFullYear() + 1, 0, 1);
    if (newYearDateThisCycle.getTime() <= today.getTime()) {
      return today.getFullYear() + 2;
    }
    return today.getFullYear() + 1;
  };

  const getHariTersisa = () => {
    const days = hitungHariKeTahunBaru();
    return days > 0 ? days : 0;
  };

  const persentaseTahunBaru = hitungPersentasePerubahanTahunBaru();
  const isNaikTahunBaru = persentaseTahunBaru !== null && Number(persentaseTahunBaru) > 0;
  const isTurunTahunBaru = persentaseTahunBaru !== null && Number(persentaseTahunBaru) < 0;

  // Nilai yang ditampilkan di kotak adalah prediksi terakhir dari deret
  const displayPrediksiTahunBaru = prediksiTahunBaruSeries && prediksiTahunBaruSeries.length > 0
    ? prediksiTahunBaruSeries[prediksiTahunBaruSeries.length - 1]
    : null;

  return (
    <div className="w-full md:w-9/10 p-5 border border-gray-200 rounded-xl bg-white shadow-md flex justify-between items-center">
      <div>
        <div className="font-sans text-md text-gray-500 mb-2">
          Prediksi Harga 1 Januari {getTahunDepan()} Model {model}
        </div>
        <div className="font-bold text-2xl text-gray-900">
          {loadingTahunBaru && 'Memuat...'}
          {errorTahunBaru && <span className="text-red-500">{errorTahunBaru}</span>}
          {!loadingTahunBaru &&
            !errorTahunBaru &&
            displayPrediksiTahunBaru !== null &&
            `Rp ${displayPrediksiTahunBaru.toLocaleString('id-ID')}`}
          {!loadingTahunBaru && !errorTahunBaru && displayPrediksiTahunBaru === null && '-'}
        </div>

        <div className="flex flex-col gap-1">
          {persentaseTahunBaru !== null ? (
            <p
              className={`text-sm font-sans ${
                isNaikTahunBaru
                  ? 'text-green-600'
                  : isTurunTahunBaru
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {isNaikTahunBaru && '↗ +'}{isTurunTahunBaru && '↘ '}{persentaseTahunBaru}% dari hari ini
            </p>
          ) : (
            <p className="text-gray-500 text-sm font-sans">
              Pilih jenis beras.
            </p>
          )}

          {jenisBeras && getHariTersisa() > 0 && (
            <p className="text-xs text-gray-400 font-sans">
              {getHariTersisa()} hari lagi menuju tahun baru
            </p>
          )}
        </div>
      </div>

      <div className="bg-purple-100 rounded-full p-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path fill="#7C3AED" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7l-.8 1.3Z"/>
        </svg>
      </div>
    </div>
  );
};

export default NewYearPred;