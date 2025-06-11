// beras-frontend/components/PriceChart.tsx
'use client'; 

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, addDays, getDate } from 'date-fns'; 

// --- Interfaces ---
type HistoricalPriceData = {
  id: number;
  date: string; // Format 'YYYY-MM-DD'
  medium_silinda: number;
  premium_silinda: number;
  medium_bapanas: number;
  premium_bapanas: number;
};

// --- BARU: Interface untuk item data di chartData ---
interface ChartDataItem {
  date: string;
  price: number;
  isPrediction: boolean;
  label: string;
}

// --- BARU: Interface untuk props TooltipContent ---
interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; payload: ChartDataItem }>;
    label?: string;
}


interface PriceChartProps {
  historicalData: HistoricalPriceData[]; 
  jenisBeras: string; 
  // predictionTomorrow: number | null; // DIHAPUS - tidak digunakan
  predictionTomorrowSeries: number[] | null; 
  predictionNewYearSeries: number[] | null; 
  predictionIdulFitriSeries: number[] | null; 
  periodePrediksi: '' | 'IdulFitri' | 'TahunBaru'; 
}

const PriceChart: React.FC<PriceChartProps> = ({
  historicalData,
  jenisBeras,
  // predictionTomorrow, // DIHAPUS dari destructuring
  predictionTomorrowSeries, 
  predictionNewYearSeries, 
  predictionIdulFitriSeries, 
  periodePrediksi,
}) => {
  if (!jenisBeras || historicalData.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-5 p-5 border rounded-lg bg-gray-50">
        Pilih jenis beras dan pastikan data historis tersedia untuk melihat grafik.
      </div>
    );
  }

  // Gunakan tipe yang lebih spesifik: ChartDataItem[]
  const chartData: ChartDataItem[] = historicalData.map((data) => ({
    date: data.date,
    price: data[jenisBeras as keyof HistoricalPriceData],
    isPrediction: false,
    label: 'Historis',
  }));

  const lastHistoricalDate = historicalData.length > 0
    ? parseISO(historicalData[historicalData.length - 1].date)
    : null;

  if (lastHistoricalDate) {
    let currentPredictionDate = lastHistoricalDate;

    // Tambahkan DERET Prediksi Besok (deret pendek)
    if (predictionTomorrowSeries && predictionTomorrowSeries.length > 0) {
        for (let i = 0; i < predictionTomorrowSeries.length; i++) {
            currentPredictionDate = addDays(currentPredictionDate, 1);
            const formattedDate = format(currentPredictionDate, 'yyyy-MM-dd');
            if (chartData.findIndex(d => d.date === formattedDate) === -1) {
                chartData.push({
                    date: formattedDate,
                    price: predictionTomorrowSeries[i],
                    isPrediction: true,
                    label: 'Prediksi Harian',
                });
            }
        }
    }

    // Tambahkan DERET Prediksi Periode Khusus (Tahun Baru / Idul Fitri)
    let seriesToAppend: number[] | null = null;
    let seriesLabel = '';

    if (periodePrediksi === 'TahunBaru' && predictionNewYearSeries && predictionNewYearSeries.length > 0) {
        seriesToAppend = predictionNewYearSeries;
        seriesLabel = 'Prediksi Tahun Baru';
    } else if (periodePrediksi === 'IdulFitri' && predictionIdulFitriSeries && predictionIdulFitriSeries.length > 0) {
        seriesToAppend = predictionIdulFitriSeries;
        seriesLabel = 'Prediksi Idul Fitri';
    }

    if (seriesToAppend) {
        let lastDateInChart = lastHistoricalDate;
        if (chartData.length > historicalData.length) { 
            lastDateInChart = parseISO(chartData[chartData.length - 1].date);
        }
        
        let currentDateForSeries = lastDateInChart;
        for (let i = 0; i < seriesToAppend.length; i++) {
            currentDateForSeries = addDays(currentDateForSeries, 1);
            const formattedDate = format(currentDateForSeries, 'yyyy-MM-dd');
            if (chartData.findIndex(d => d.date === formattedDate) === -1) {
                chartData.push({
                    date: formattedDate,
                    price: seriesToAppend[i],
                    isPrediction: true,
                    label: seriesLabel,
                });
            }
        }
    }
  }

  // Pastikan seluruh data (historis + prediksi) diurutkan berdasarkan tanggal.
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Formatter untuk label pada XAxis (sumbu tanggal)
  const dateFormatter = (isoDateString: string) => {
    return format(parseISO(isoDateString), 'MMM dd, yy'); 
  };

  // Komponen kustom untuk Tooltip (kotak info saat hover pada grafik).
  // Gunakan interface CustomTooltipProps yang baru.
  const TooltipContent: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.date === label);
      return (
        <div className="custom-tooltip bg-white p-3 border border-gray-300 rounded shadow-md">
          <p className="label font-bold text-gray-800">{`Tanggal : ${format(parseISO(label || ''), 'dd MMMMyyyy')}`}</p> {/* handle label || '' for safety */}
          <p className="intro text-indigo-700">{`Harga : Rp ${payload[0]?.value?.toLocaleString('id-ID')}`}</p> {/* handle payload[0]?.value for safety */}
          {dataPoint?.isPrediction && <p className="desc text-sm text-gray-500">{dataPoint.label}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full md:w-9/10 h-[450px] bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Grafik Harga {jenisBeras.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 40,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tickFormatter={dateFormatter}
            minTickGap={30} 
            angle={-30} 
            textAnchor="end" 
            height={60} 
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <YAxis
            domain={['dataMin - 1000', 'dataMax + 1000']} 
            tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
            tick={{ fill: '#666', fontSize: 12 }}
            width={100} 
          />
          <Tooltip content={<TooltipContent />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#6366f1" 
            strokeWidth={2}
            name={`Harga ${jenisBeras.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}`}
            dot={({ cx, cy, key, payload }) => { // Hapus 'stroke' dari destructuring
                const dateObj = parseISO(payload.date);
                // Tampilkan dot hanya jika tanggalnya adalah tanggal 1 setiap bulan
                if (getDate(dateObj) === 1) { 
                    return (
                        <circle 
                            key={key} 
                            cx={cx} 
                            cy={cy} 
                            r={payload.isPrediction ? 6 : 4} 
                            fill={payload.isPrediction ? "#ef4444" : "#6366f1"} 
                            stroke={payload.isPrediction ? "#dc2626" : "#6366f1"} 
                            strokeWidth={payload.isPrediction ? 2 : 1}
                        />
                    ); 
                }
                return null; 
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-sm text-center text-gray-600 mt-4 flex justify-center gap-6">
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 rounded-full bg-indigo-500 mr-2"></span> Data Historis
        </div>
        <div className="flex items-center">
          <span className="inline-block w-4 h-4 rounded-full bg-red-500 mr-2"></span> Titik Prediksi
        </div>
      </div>
    </div>
  );
};

export default PriceChart;