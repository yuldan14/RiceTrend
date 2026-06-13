// beras-frontend/components/IdulFitriPred.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  calculateChangePercent,
  formatCurrency,
  getDaysFromBaseToTarget,
  getNextIdulFitriDate,
  getPredictionSeriesToDate,
  type HargaData,
  type PredictionModel,
  type SelectedRiceCategory,
} from '../utils/api';

interface IdulFitriPredProps {
  jenisBeras: SelectedRiceCategory;
  model: PredictionModel;
  hargaHariIni: HargaData;
  baseDate: string | null;
  onPredictionResult?: (predictions: number[] | null) => void;
}

const IdulFitriPred: React.FC<IdulFitriPredProps> = ({
  jenisBeras,
  model,
  hargaHariIni,
  baseDate,
  onPredictionResult,
}) => {
  const [prediksiIdulFitriSeries, setPrediksiIdulFitriSeries] = useState<number[] | null>(null);
  const [loadingIdulFitri, setLoadingIdulFitri] = useState(false);
  const [errorIdulFitri, setErrorIdulFitri] = useState('');

  const targetIdulFitriDate = useMemo(
    () => (baseDate ? getNextIdulFitriDate(baseDate) : null),
    [baseDate],
  );

  useEffect(() => {
    const fetchPredictionIdulFitri = async () => {
      if (!jenisBeras || !baseDate) {
        setPrediksiIdulFitriSeries(null);
        setErrorIdulFitri('Pilih jenis beras dan tunggu data harga dimuat.');
        onPredictionResult?.(null);
        setLoadingIdulFitri(false);
        return;
      }

      if (!targetIdulFitriDate) {
        setPrediksiIdulFitriSeries(null);
        setErrorIdulFitri('Tidak dapat menentukan tanggal Idul Fitri mendatang.');
        onPredictionResult?.(null);
        setLoadingIdulFitri(false);
        return;
      }

      setLoadingIdulFitri(true);
      setErrorIdulFitri('');
      setPrediksiIdulFitriSeries(null);
      onPredictionResult?.(null);

      try {
        const predictionResult = await getPredictionSeriesToDate(
          jenisBeras,
          model,
          baseDate,
          targetIdulFitriDate,
        );

        if (predictionResult.length > 0) {
          setPrediksiIdulFitriSeries(predictionResult);
          onPredictionResult?.(predictionResult);
        } else {
          setErrorIdulFitri('API tidak mengembalikan hasil prediksi.');
          onPredictionResult?.(null);
        }
      } catch (err: unknown) {
        console.error('Error fetching Idul Fitri prediction:', err);
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.';
        setErrorIdulFitri(`Gagal mengambil prediksi Idul Fitri: ${message}`);
        onPredictionResult?.(null);
      } finally {
        setLoadingIdulFitri(false);
      }
    };

    fetchPredictionIdulFitri();
  }, [jenisBeras, model, baseDate, targetIdulFitriDate, onPredictionResult]);

  const displayPrediksiIdulFitri = prediksiIdulFitriSeries && prediksiIdulFitriSeries.length > 0
    ? prediksiIdulFitriSeries[prediksiIdulFitriSeries.length - 1]
    : null;
  const persentaseIdulFitri = jenisBeras
    ? calculateChangePercent(hargaHariIni[jenisBeras], displayPrediksiIdulFitri)
    : null;
  const isNaikIdulFitri = persentaseIdulFitri !== null && Number(persentaseIdulFitri) > 0;
  const isTurunIdulFitri = persentaseIdulFitri !== null && Number(persentaseIdulFitri) < 0;
  const hariTersisa = baseDate && targetIdulFitriDate
    ? getDaysFromBaseToTarget(baseDate, targetIdulFitriDate)
    : 0;

  return (
    <div className="w-full md:w-9/10 p-5 border border-gray-200 rounded-xl bg-white flex justify-between items-center">
      <div>
        <div className="font-sans text-md text-gray-500 mb-2">
          Prediksi Harga Idul Fitri {targetIdulFitriDate ? targetIdulFitriDate.getFullYear() : 'Mendatang'} Model {model}
        </div>
        <div className="font-bold text-2xl text-gray-900">
          {loadingIdulFitri && 'Memuat...'}
          {errorIdulFitri && <span className="text-red-500">{errorIdulFitri}</span>}
          {!loadingIdulFitri && !errorIdulFitri && displayPrediksiIdulFitri !== null && (
            formatCurrency(displayPrediksiIdulFitri)
          )}
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
              {isNaikIdulFitri && '+'}{persentaseIdulFitri}% dari hari ini
            </p>
          ) : (
            <p className="text-gray-500 text-sm font-sans">
              Pilih jenis beras.
            </p>
          )}

          {jenisBeras && hariTersisa > 0 && targetIdulFitriDate && (
            <p className="text-xs text-gray-400 font-sans">
              {hariTersisa} hari dari data terakhir menuju {targetIdulFitriDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
