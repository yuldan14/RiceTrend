"use client";
import React, { useState, useEffect } from "react";
import {
  predictMediumSilindaArima,
  predictMediumSilindaLstm,
  predictPremiumSilindaArima,
  predictPremiumSilindaLstm,
  predictMediumBapanasArima,
  predictMediumBapanasLstm,
  predictPremiumBapanasArima,
  predictPremiumBapanasLstm,
} from "../utils/api";

type HargaData = {
  [key: string]: number;
};

interface NewYearPredProps {
  jenisBeras: string;
  model: string;
  hargaHariIni: HargaData;
}

const NewYearPred: React.FC<NewYearPredProps> = ({
  jenisBeras,
  model,
  hargaHariIni,
}) => {
  const [prediksiTahunBaru, setPrediksiTahunBaru] = useState<number | null>(null);
  const [loadingTahunBaru, setLoadingTahunBaru] = useState(false);
  const [errorTahunBaru, setErrorTahunBaru] = useState("");

  // Fungsi untuk menghitung jumlah hari dari hari ini sampai 1 Januari tahun depan
  const hitungHariKeTahunBaru = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextYear = currentYear + 1;
    const newYearDate = new Date(nextYear, 0, 1); // 1 Januari tahun depan
    
    const diffTime = newYearDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Fungsi untuk mengambil prediksi tahun baru
  const fetchPredictionTahunBaru = async () => {
    if (!jenisBeras) {
      setPrediksiTahunBaru(null);
      return;
    }

    setLoadingTahunBaru(true);
    setErrorTahunBaru("");
    setPrediksiTahunBaru(null);

    try {
      const stepsToNewYear = hitungHariKeTahunBaru();
      let result: number[] = [];

      switch (jenisBeras) {
        case "medium_silinda":
          result =
            model === "ARIMA"
              ? await predictMediumSilindaArima(stepsToNewYear)
              : await predictMediumSilindaLstm(stepsToNewYear);
          break;
        case "premium_silinda":
          result =
            model === "ARIMA"
              ? await predictPremiumSilindaArima(stepsToNewYear)
              : await predictPremiumSilindaLstm(stepsToNewYear);
          break;
        case "medium_bapanas":
          result =
            model === "ARIMA"
              ? await predictMediumBapanasArima(stepsToNewYear)
              : await predictPremiumBapanasLstm(stepsToNewYear);
          break;
        case "premium_bapanas":
          result =
            model === "ARIMA"
              ? await predictPremiumBapanasArima(stepsToNewYear)
              : await predictPremiumBapanasLstm(stepsToNewYear);
          break;
        default:
          throw new Error("Jenis beras tidak valid");
      }

      // Ambil prediksi terakhir (untuk tanggal 1 Januari)
      setPrediksiTahunBaru(result[result.length - 1]);
    } catch (err) {
      console.error("Error fetching new year prediction:", err);
      setErrorTahunBaru("Gagal mengambil prediksi tahun baru.");
    } finally {
      setLoadingTahunBaru(false);
    }
  };

  // Effect untuk mengambil prediksi ketika props berubah
  useEffect(() => {
    fetchPredictionTahunBaru();
  }, [jenisBeras, model]);

  // Fungsi hitung persentase perubahan dari hari ini ke prediksi tahun baru
  const hitungPersentasePerubahanTahunBaru = () => {
    if (
      jenisBeras &&
      prediksiTahunBaru !== null &&
      hargaHariIni[jenisBeras] !== undefined
    ) {
      const hargaSekarang = hargaHariIni[jenisBeras];
      const hargaPrediksi = prediksiTahunBaru;
      const perubahan = ((hargaPrediksi - hargaSekarang) / hargaSekarang) * 100;
      return perubahan.toFixed(2);
    }
    return null;
  };

  // Mendapatkan tahun depan untuk label
  const getTahunDepan = () => {
    const currentYear = new Date().getFullYear();
    return currentYear + 1;
  };

  // Mendapatkan jumlah hari tersisa ke tahun baru
  const getHariTersisa = () => {
    return hitungHariKeTahunBaru();
  };

  const persentaseTahunBaru = hitungPersentasePerubahanTahunBaru();
  const isNaikTahunBaru = persentaseTahunBaru !== null && Number(persentaseTahunBaru) > 0;
  const isTurunTahunBaru = persentaseTahunBaru !== null && Number(persentaseTahunBaru) < 0;

  return (
    <div className="w-9/10 h-30 border border-gray-200 rounded-2xl bg-gray-100 px-5 flex justify-between items-center">
      <div>
        <div className="font-sans text-md text-gray-500 mb-2">
          Prediksi Harga 1 Januari {getTahunDepan()} Model {model}
        </div>
        <div className="font-bold text-xl">
          {loadingTahunBaru && "Memuat..."}
          {errorTahunBaru && <span className="text-red-500">{errorTahunBaru}</span>}
          {!loadingTahunBaru &&
            !errorTahunBaru &&
            prediksiTahunBaru !== null &&
            `Rp ${prediksiTahunBaru.toLocaleString()}`}
          {!loadingTahunBaru && !errorTahunBaru && prediksiTahunBaru === null && "-"}
        </div>
        
        {/* Keterangan naik/turun dari hari ini */}
        <div className="flex flex-col gap-1">
          {persentaseTahunBaru !== null ? (
            <p
              className={`text-sm font-sans ${
                isNaikTahunBaru
                  ? "text-green-600"
                  : isTurunTahunBaru
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {isNaikTahunBaru && "↗ +"}{isTurunTahunBaru && "↘ "}{persentaseTahunBaru}% dari hari ini
            </p>
          ) : (
            <p className="text-gray-500 text-sm font-sans">
              Data perubahan tidak tersedia
            </p>
          )}
          
          {/* Informasi tambahan hari tersisa */}
          {jenisBeras && (
            <p className="text-xs text-gray-400 font-sans">
              {getHariTersisa()} hari lagi menuju tahun baru
            </p>
          )}
        </div>
      </div>
      
      <div className="bg-purple-300 rounded-md w-min h-min">
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24">
          <path fill="#7C3AED" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m4.2 14.2L11 13V7h1.5v5.2l4.5 2.7l-.8 1.3Z"/>
        </svg>
      </div>
    </div>
  );
};

export default NewYearPred;