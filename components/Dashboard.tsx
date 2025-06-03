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
import NewYearPred from "./NewYearPred";

type HargaData = {
  [key: string]: number;
};

const Dashboard = () => {
  const [jenisBeras, setJenisBeras] = useState("");
  const [model, setModel] = useState("ARIMA");
  const [prediksi, setPrediksi] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hargaHariIni, setHargaHariIni] = useState<HargaData>({});
  const [hargaKemarin, setHargaKemarin] = useState<HargaData>({});

  useEffect(() => {
    const fetchHarga = async () => {
      try {
        const res = await fetch("/data_harga.json");
        if (!res.ok) throw new Error("Gagal memuat data harga hari ini");

        const dataArray: {
          id: number;
          date: string;
          medium_silinda: number;
          premium_silinda: number;
          medium_bapanas: number;
          premium_bapanas: number;
        }[] = await res.json();

        const latestData = dataArray[dataArray.length - 1]; // data hari ini
        const yesterdayData = dataArray[dataArray.length - 2]; // data kemarin

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
      } catch (err) {
        console.error(err);
      }
    };

    fetchHarga();
  }, []);

  const fetchPrediction = async () => {
    if (!jenisBeras) return;

    setLoading(true);
    setError("");
    setPrediksi(null);

    try {
      let result: number[] = [];

      switch (jenisBeras) {
        case "medium_silinda":
          result =
            model === "ARIMA"
              ? await predictMediumSilindaArima(1)
              : await predictMediumSilindaLstm(1);
          break;
        case "premium_silinda":
          result =
            model === "ARIMA"
              ? await predictPremiumSilindaArima(1)
              : await predictPremiumSilindaLstm(1);
          break;
        case "medium_bapanas":
          result =
            model === "ARIMA"
              ? await predictMediumBapanasArima(1)
              : await predictMediumBapanasLstm(1);
          break;
        case "premium_bapanas":
          result =
            model === "ARIMA"
              ? await predictPremiumBapanasArima(1)
              : await predictPremiumBapanasLstm(1);
          break;
      }

      setPrediksi(result[0]);
    } catch (err) {
      setError("Gagal mengambil prediksi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [jenisBeras, model]);

  // Fungsi hitung persentase perubahan dari hari ini ke prediksi besok
  const hitungPersentasePerubahan = () => {
    if (
      jenisBeras &&
      prediksi !== null &&
      hargaHariIni[jenisBeras] !== undefined
    ) {
      const hargaSekarang = hargaHariIni[jenisBeras];
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
      {/* Title */}
      <div className="shadow-md h-15 ">
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
            onChange={(e) => setJenisBeras(e.target.value)}
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
            onChange={(e) => setModel(e.target.value)}
            className="w-100 h-10 px-4 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
          >
            <option value="ARIMA">ARIMA</option>
            <option value="LSTM">LSTM</option>
          </select>
        </div>
      </div>

      {/* Box Dashboard */}
      <div className="w-full h-full py-10 flex flex-col items-center justify-center gap-10">
        {/* Harga Saat Ini */}
        <div className="flex w-9/10 h-30 border border-gray-200 rounded-2xl bg-gray-100 px-5 justify-between items-center">
          <div className="">
            <div className="font-sans text-md text-gray-500 mb-2">
              Harga Saat Ini
            </div>
            <div className="font-bold text-xl">
              {jenisBeras && hargaHariIni[jenisBeras] !== undefined
                ? `Rp ${hargaHariIni[jenisBeras].toLocaleString()}`
                : "-"}
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
              {loading && "Memuat..."}
              {error && <span className="text-red-500">{error}</span>}
              {!loading &&
                !error &&
                prediksi !== null &&
                `Rp ${prediksi.toLocaleString()}`}
              {!loading && !error && prediksi === null && "-"}
            </div>
            {/* Keterangan naik/turun dari hari ini */}
            <div>
              {persentase !== null ? (
                <p
                  className={`text-sm font-sans ${
                    isNaik
                      ? "text-green-600"
                      : isTurun
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {isNaik && "↗ +"}{isTurun && "↘ "}{persentase}% dari hari ini
                </p>
              ) : (
                <p className="text-gray-500 text-sm font-sans">
                  Data perubahan tidak tersedia
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
         
      </div>
    </div>
  );
};

export default Dashboard;