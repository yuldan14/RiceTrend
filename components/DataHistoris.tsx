'use client';
import React, { useState, useEffect, useRef } from 'react';
import Chart, { TooltipItem } from 'chart.js/auto'; // Import Chart dan TooltipItem

// --- Interface untuk Struktur Data ---
interface PriceData {
  id: number;
  date: string;
  medium_silinda: number;
  premium_silinda: number;
  medium_bapanas: number;
  premium_bapanas: number;
}

const DataHistoris: React.FC = () => {
  // --- States ---
  const [rawData, setRawData] = useState<PriceData[]>([]);
  const [filteredData, setFilteredData] = useState<PriceData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States untuk Paginasi
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5; // Menampilkan 5 item per halaman

  // Ref untuk elemen canvas grafik
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null); // Menyimpan instance Chart.js

  // --- useEffect untuk Mengambil Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data_harga.json');
        if (!response.ok) {
          throw new Error(`Gagal mengambil data: Status ${response.status}`);
        }
        const jsonData: PriceData[] = await response.json();
        // Urutkan data berdasarkan tanggal dari yang terbaru ke terlama saat pertama kali dimuat
        const sortedData = jsonData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRawData(sortedData);
        setFilteredData(sortedData); // Awalnya, tampilkan semua data yang diambil
      } catch (err) {
        if (err instanceof Error) {
          setError(`Terjadi kesalahan: ${err.message}`);
        } else {
          setError('Terjadi kesalahan yang tidak diketahui.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- useEffect untuk Update Grafik saat filteredData berubah ---
  useEffect(() => {
    if (chartRef.current && filteredData.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy(); // Hancurkan instance chart yang lama jika ada
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Balikkan data untuk grafik agar tampilan dari terlama ke terbaru (kiri ke kanan)
        const labels = filteredData.map(item => new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })).reverse();
        const mediumSilindaPrices = filteredData.map(item => item.medium_silinda).reverse();
        const premiumSilindaPrices = filteredData.map(item => item.premium_silinda).reverse();
        const mediumBapanasPrices = filteredData.map(item => item.medium_bapanas).reverse();
        const premiumBapanasPrices = filteredData.map(item => item.premium_bapanas).reverse();

        chartInstance.current = new Chart(ctx, {
          type: 'line', // Jenis grafik garis
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Medium Silinda',
                data: mediumSilindaPrices,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false,
              },
              {
                label: 'Premium Silinda',
                data: premiumSilindaPrices,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
                fill: false,
              },
              {
                label: 'Medium Bapanas',
                data: mediumBapanasPrices,
                borderColor: 'rgb(54, 162, 235)',
                tension: 0.1,
                fill: false,
              },
              {
                label: 'Premium Bapanas',
                data: premiumBapanasPrices,
                borderColor: 'rgb(255, 205, 86)',
                tension: 0.1,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false, // Penting agar tinggi fix bisa diterapkan
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Harga (Rp/kg)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Tanggal'
                },
                // Atur ticks agar tidak terlalu padat jika banyak data
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 10 // Maksimal 10 label pada sumbu X
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  // Perbaikan: Memberikan tipe eksplisit pada 'context'
                  label: function(context: TooltipItem<'line'>) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
                    }
                    return label;
                  }
                }
              },
              legend: {
                position: 'bottom', // Posisikan legend di bawah grafik
              }
            }
          },
        });
      }
    }
  }, [filteredData]); // Jalankan efek ini setiap kali filteredData berubah

  // --- Fungsi untuk Menerapkan Filter ---
  const handleApplyFilter = () => {
    setCurrentPage(1); // Reset halaman ke 1 setiap kali filter diterapkan
    let tempFilteredData = [...rawData];

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      tempFilteredData = tempFilteredData.filter(item => {
        const itemDate = new Date(item.date);
        const isAfterStart = start ? itemDate >= start : true;
        const isBeforeEnd = end ? itemDate <= end : true;
        return isAfterStart && isBeforeEnd;
      });
    }

    setFilteredData(tempFilteredData);
  };

  // --- Logika Paginasi ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div>
      {/* --- Title Dashboard --- */}
      <div className="shadow-md h-15 bg-white">
        <span className="h-full w-full flex items-center font-sans font-bold text-lg text-gray-900 ml-5">
          Data Harga Historis
        </span>
      </div>

      <div className="mt-10 pl-10 pr-10 flex flex-col gap-y-8">
        {/* --- Filter Pilih Periode Tanggal --- */}
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="start-date" className="font-semibold text-gray-700">Dari:</label>
          <input
            type="date"
            id="start-date"
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label htmlFor="end-date" className="font-semibold text-gray-700">Sampai:</label>
          <input
            type="date"
            id="end-date"
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleApplyFilter}
          >
            Terapkan Filter
          </button>
        </div>

        {/* --- Area Visualisasi Grafis --- */}
        <div className="mt-8 p-5 border border-gray-200 rounded-lg bg-white shadow-sm h-[400px]">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Grafik Harga Beras Historis</h3>
          {loading && <p className="text-center text-gray-600">Memuat grafik...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && filteredData.length === 0 && (
            <p className="text-center text-gray-500">Tidak ada data untuk grafik dengan filter ini.</p>
          )}
          {!loading && !error && filteredData.length > 0 && (
            <canvas ref={chartRef}></canvas>
          )}
        </div>

        {/* --- Area Tampilan Data Historis (Tabel dengan Paginasi) --- */}
        <div className="mt-8 p-5 border border-gray-200 rounded-lg bg-white min-h-[300px] shadow-sm">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">Tabel Data Historis</h3>
          {loading && <p className="text-center text-gray-600">Memuat data tabel...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && filteredData.length === 0 && (
            <p className="text-center text-gray-500">Tidak ada data yang ditemukan untuk filter ini.</p>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medium Silinda (Rp/kg)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Premium Silinda (Rp/kg)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medium Bapanas (Rp/kg)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Premium Bapanas (Rp/kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Perbaikan: currentItems.map sudah benar, pastikan tidak ada tag penutup yang salah */}
                    {currentItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.medium_silinda.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.premium_silinda.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.medium_bapanas.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.premium_bapanas.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Kontrol Paginasi */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataHistoris;