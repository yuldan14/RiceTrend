// beras-frontend/components/NewYearPred.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  calculateChangePercent,
  formatCurrency,
  getDaysFromBaseToTarget,
  getNextNewYearDate,
  getPredictionSeriesToDate,
  type HargaData,
  type PredictionModel,
  type SelectedRiceCategory,
} from '../utils/api';

interface NewYearPredProps {
  jenisBeras: SelectedRiceCategory;
  model: PredictionModel;
  hargaHariIni: HargaData;
  baseDate: string | null;
  onPredictionResult?: (predictions: number[] | null) => void;
}

const NewYearPred: React.FC<NewYearPredProps> = ({
  jenisBeras,
  model,
  hargaHariIni,
  baseDate,
  onPredictionResult,
}) => {
  const [prediksiTahunBaruSeries, setPrediksiTahunBaruSeries] = useState<number[] | null>(null);
  const [loadingTahunBaru, setLoadingTahunBaru] = useState(false);
  const [errorTahunBaru, setErrorTahunBaru] = useState('');

  const targetDate = useMemo(
    () => (baseDate ? getNextNewYearDate(baseDate) : null),
    [baseDate],
  );

  useEffect(() => {
    const fetchPredictionTahunBaru = async () => {
      if (!jenisBeras || !baseDate || !targetDate) {
        setPrediksiTahunBaruSeries(null);
        setErrorTahunBaru('Pilih jenis beras dan tunggu data harga dimuat.');
        onPredictionResult?.(null);
        setLoadingTahunBaru(false);
        return;
      }

      setLoadingTahunBaru(true);
      setErrorTahunBaru('');
      setPrediksiTahunBaruSeries(null);
      onPredictionResult?.(null);

      try {
        const predictionResult = await getPredictionSeriesToDate(
          jenisBeras,
          model,
          baseDate,
          targetDate,
        );

        if (predictionResult.length > 0) {
          setPrediksiTahunBaruSeries(predictionResult);
          onPredictionResult?.(predictionResult);
        } else {
          setErrorTahunBaru('API tidak mengembalikan hasil prediksi.');
          onPredictionResult?.(null);
        }
      } catch (err: unknown) {
        console.error('Error fetching new year prediction:', err);
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
        setErrorTahunBaru(`Gagal mengambil prediksi tahun baru: ${message}`);
        onPredictionResult?.(null);
      } finally {
        setLoadingTahunBaru(false);
      }
    };

    fetchPredictionTahunBaru();
  }, [jenisBeras, model, baseDate, targetDate, onPredictionResult]);

  const displayPrediksiTahunBaru = prediksiTahunBaruSeries && prediksiTahunBaruSeries.length > 0
    ? prediksiTahunBaruSeries[prediksiTahunBaruSeries.length - 1]
    : null;
  const persentaseTahunBaru = jenisBeras
    ? calculateChangePercent(hargaHariIni[jenisBeras], displayPrediksiTahunBaru)
    : null;
  const isNaikTahunBaru = persentaseTahunBaru !== null && Number(persentaseTahunBaru) > 0;
  const isTurunTahunBaru = persentaseTahunBaru !== null && Number(persentaseTahunBaru) < 0;
  const hariTersisa = baseDate && targetDate ? getDaysFromBaseToTarget(baseDate, targetDate) : 0;

  return (
    <div className="w-full md:w-9/10 p-5 border border-gray-200 rounded-xl bg-white flex justify-between items-center">
      <div>
        <div className="font-sans text-md text-gray-500 mb-2">
          Prediksi Harga 1 Januari {targetDate ? targetDate.getFullYear() : 'Mendatang'} Model {model}
        </div>
        <div className="font-bold text-2xl text-gray-900">
          {loadingTahunBaru && 'Memuat...'}
          {errorTahunBaru && <span className="text-red-500">{errorTahunBaru}</span>}
          {!loadingTahunBaru && !errorTahunBaru && displayPrediksiTahunBaru !== null && (
            formatCurrency(displayPrediksiTahunBaru)
          )}
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
              {isNaikTahunBaru && '+'}{persentaseTahunBaru}% dari hari ini
            </p>
          ) : (
            <p className="text-gray-500 text-sm font-sans">
              Pilih jenis beras.
            </p>
          )}

          {jenisBeras && hariTersisa > 0 && (
            <p className="text-xs text-gray-400 font-sans">
              {hariTersisa} hari dari data terakhir menuju tahun baru
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
