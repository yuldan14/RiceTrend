// beras-frontend/components/IdulFitriPred.tsx
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
} from '../utils/api'; 
import { format, parseISO } from 'date-fns'; // Hapus `addDays` dari impor

type HargaData = {
  [key: string]: number | undefined;
};

interface IdulFitriPredProps {
  jenisBeras: keyof HargaData;
  model: 'ARIMA' | 'LSTM';
  hargaHariIni: HargaData;
  onPredictionResult?: (predictions: number[] | null) => void; 
}

const IdulFitriPred: React.FC<IdulFitriPredProps> = ({
  jenisBeras,
  model,
  hargaHariIni,
  onPredictionResult,
}) => {
  const [prediksiIdulFitriSeries, setPrediksiIdulFitriSeries] = useState<number[] | null>(null);
  const [loadingIdulFitri, setLoadingIdulFitri] = useState(false);
  const [errorIdulFitri, setErrorIdulFitri] = useState('');
  const [targetIdulFitriDate, setTargetIdulFitriDate] = useState<Date | null>(null);
  const [targetIdulFitriYear, setTargetIdulFitriYear] = useState<number | null>(null);

  // --- Fungsi: Menentukan Tanggal Idul Fitri Mendatang ---
  // Dibuat dengan useCallback agar stabil dan tidak menyebabkan efek samping berulang
  const getNextIdulFitriDate = useCallback((): Date | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const idulFitriDates = [
        new Date(2025, 3, 31), // 31 Maret 2025
        new Date(2026, 3, 20), // 20 Maret 2026
        new Date(2027, 3, 9),  // 9 Maret 2027
    ];

    for (const date of idulFitriDates) {
        if (date.getTime() >= today.getTime()) {
            return date;
        }
    }
    
    console.warn("Tanggal Idul Fitri mendatang tidak ditemukan dalam daftar. Harap perbarui data.");
    return null; 
  }, []); // Dependensi kosong karena tidak bergantung pada props/state

  // Efek samping untuk menentukan tanggal Idul Fitri target saat komponen pertama kali dimuat.
  // Bergantung pada `getNextIdulFitriDate` (yang di-memoize dengan useCallback)
  useEffect(() => {
    const nextIdulFitri = getNextIdulFitriDate();
    if (nextIdulFitri) {
      setTargetIdulFitriDate(nextIdulFitri);
      setTargetIdulFitriYear(nextIdulFitri.getFullYear());
    } else {
      setTargetIdulFitriDate(null);
      setTargetIdulFitriYear(null);
      setErrorIdulFitri('Tidak dapat menentukan tanggal Idul Fitri mendatang.');
    }
  }, [getNextIdulFitriDate]); // Tambahkan getNextIdulFitriDate sebagai dependensi

  // Fungsi untuk menghitung jumlah hari dari hari ini hingga tanggal Idul Fitri target.
  // Dibuat dengan useCallback agar stabil dan tidak menyebabkan efek samping berulang
  const hitungHariKeIdulFitri = useCallback((): number => {
    if (!targetIdulFitriDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const diffTime = targetIdulFitriDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0; 
  }, [targetIdulFitriDate]); // Bergantung pada targetIdulFitriDate

  // Fungsi untuk mengambil prediksi harga Idul Fitri dari API (sekarang dari JSON lokal).
  // Dibuat dengan useCallback agar stabil
  const fetchPredictionIdulFitri = useCallback(async () => {
    if (!jenisBeras || !targetIdulFitriDate) {
      setPrediksiIdulFitriSeries(null);
      setErrorIdulFitri('Pilih jenis beras dan tunggu tanggal Idul Fitri dimuat.');
      if (onPredictionResult) onPredictionResult(null);
      setLoadingIdulFitri(false);
      return;
    }

    setLoadingIdulFitri(true);
    setErrorIdulFitri('');
    setPrediksiIdulFitriSeries(null); 
    if (onPredictionResult) onPredictionResult(null);

    try {
      const stepsToIdulFitri = hitungHariKeIdulFitri();
      if (stepsToIdulFitri <= 0) {
        setPrediksiIdulFitriSeries(null); 
        setErrorIdulFitri(`Idul Fitri ${targetIdulFitriYear} sudah lewat atau hari ini.`);
        if (onPredictionResult) onPredictionResult(null); 
        setLoadingIdulFitri(false);
        return;
      }
      
      let predictionResult: number[] = [];
      const api = await import('../utils/api'); // Import dinamis

      switch (jenisBeras) {
        case 'medium_silinda':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictMediumSilindaArima(stepsToIdulFitri)
              : await api.predictMediumSilindaLstm(stepsToIdulFitri);
          break;
        case 'premium_silinda':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictPremiumSilindaArima(stepsToIdulFitri)
              : await api.predictPremiumSilindaLstm(stepsToIdulFitri);
          break;
        case 'medium_bapanas':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictMediumBapanasArima(stepsToIdulFitri)
              : await api.predictMediumBapanasLstm(stepsToIdulFitri);
          break;
        case 'premium_bapanas':
          predictionResult =
            model === 'ARIMA'
              ? await api.predictPremiumBapanasArima(stepsToIdulFitri)
              : await api.predictPremiumBapanasLstm(stepsToIdulFitri);
          break;
        default:
          throw new Error('Jenis beras tidak valid.');
      }

      if (predictionResult.length > 0) {
        setPrediksiIdulFitriSeries(predictionResult); 
        if (onPredictionResult) onPredictionResult(predictionResult);
      } else {
        setErrorIdulFitri('API tidak mengembalikan hasil prediksi.');
        if (onPredictionResult) onPredictionResult(null);
      }
    } catch (err: unknown) { // Menggunakan 'unknown' untuk tipe error yang lebih aman
      console.error('Error fetching Idul Fitri prediction:', err);
      if (err instanceof Error) {
          setErrorIdulFitri(`Gagal mengambil prediksi Idul Fitri: ${err.message}`);
      } else {
          setErrorIdulFitri('Gagal mengambil prediksi Idul Fitri: Terjadi kesalahan tidak diketahui.');
      }
      if (onPredictionResult) onPredictionResult(null);
    } finally {
      setLoadingIdulFitri(false);
    }
  }, [jenisBeras, model, targetIdulFitriDate, hitungHariKeIdulFitri, onPredictionResult, targetIdulFitriYear]); // Tambahkan dependensi

  // Efek samping untuk memicu pengambilan prediksi Idul Fitri.
  useEffect(() => {
    if (jenisBeras && targetIdulFitriDate) {
      fetchPredictionIdulFitri();
    } else {
      setPrediksiIdulFitriSeries(null);
      setErrorIdulFitri('Pilih jenis beras.');
      if (onPredictionResult) onPredictionResult(null);
    }
  }, [jenisBeras, targetIdulFitriDate, fetchPredictionIdulFitri, onPredictionResult]); // Tambahkan dependensi

  // Fungsi untuk menghitung persentase perubahan harga (menggunakan nilai terakhir dari deret prediksi)
  const hitungPersentasePerubahanIdulFitri = () => {
    const prediksiAkhir = prediksiIdulFitriSeries && prediksiIdulFitriSeries.length > 0
      ? prediksiIdulFitriSeries[prediksiIdulFitriSeries.length - 1]
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

  const persentaseIdulFitri = hitungPersentasePerubahanIdulFitri();
  const isNaikIdulFitri = persentaseIdulFitri !== null && Number(persentaseIdulFitri) > 0;
  const isTurunIdulFitri = persentaseIdulFitri !== null && Number(persentaseIdulFitri) < 0;

  // Nilai yang ditampilkan di kotak adalah prediksi terakhir dari deret
  const displayPrediksiIdulFitri = prediksiIdulFitriSeries && prediksiIdulFitriSeries.length > 0
    ? prediksiIdulFitriSeries[prediksiIdulFitriSeries.length - 1]
    : null;

  return (
    <div className="w-full md:w-9/10 p-5 border border-gray-200 rounded-xl bg-white shadow-md flex justify-between items-center">
      <div>
        <div className="font-sans text-md text-gray-500 mb-2">
          Prediksi Harga Idul Fitri {targetIdulFitriYear ? targetIdulFitriYear : 'Mendatang'} Model {model}
        </div>
        <div className="font-bold text-2xl text-gray-900">
          {loadingIdulFitri && 'Memuat...'}
          {errorIdulFitri && <span className="text-red-500">{errorIdulFitri}</span>}
          {!loadingIdulFitri &&
            !errorIdulFitri &&
            displayPrediksiIdulFitri !== null &&
            `Rp ${displayPrediksiIdulFitri.toLocaleString('id-ID')}`}
          {!loadingIdulFitri && !errorIdulFitri && displayPrediksiIdulFitri === null && '-'}
        </div>

        <div className="flex flex-col gap-1">
          {persentaseIdulFitri !== null ? (
            <p
              className={`text-sm font-sans ${
                isNaikIdulFitri
                  ? 'text-green-600'
                  : isTurunIdulFitri
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {isNaikIdulFitri && '↗ +'}{isTurunIdulFitri && '↘ '}{persentaseIdulFitri}% dari hari ini
            </p>
          ) : (
            <p className="text-gray-500 text-sm font-sans">
              Pilih jenis beras.
            </p>
          )}

          {jenisBeras && hitungHariKeIdulFitri() > 0 && targetIdulFitriDate && (
            <p className="text-xs text-gray-400 font-sans">
              {hitungHariKeIdulFitri()} hari lagi menuju {targetIdulFitriDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <div className="bg-yellow-100 rounded-full p-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
          <path fill="#CA8A04" d="M12 3a9 9 0 0 0-9 9a9 9 0 0 0 9 9a9 9 0 0 0 9-9A9 9 0 0 0 12 3m0 2q.5 0 .975.213t.8.637l2.25 2.25q.425.425.638.975t.212.975q0 .5-.213.975t-.637.8l-2.25 2.25q-.425.425-.975.638t-.975.212q-.5 0-.975-.213t-.8-.637l-2.25-2.25q-.425-.425-.638-.975t-.212-.975q0-.5.213-.975t.637-.8l2.25-2.25q.425-.425.975-.638t.975-.212M7 11h10v2H7z"/>
        </svg>
      </div>
    </div>
  );
};

export default IdulFitriPred;