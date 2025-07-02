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
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    {/* --- Title Dashboard --- */}
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Data Harga Historis
          </h1>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* --- Filter Pilih Periode Tanggal --- */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          Filter Periode
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-700">Dari:</label>
            <input
              type="date"
              id="start-date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="end-date" className="text-sm font-medium text-gray-700">Sampai:</label>
            <input
              type="date"
              id="end-date"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            onClick={handleApplyFilter}
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* --- Area Visualisasi Grafis --- */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Grafik Harga Beras Historis
        </h3>
        
        <div className="h-96 relative">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Memuat grafik...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-500 font-medium">Error: {error}</p>
              </div>
            </div>
          )}
          {!loading && !error && filteredData.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500">Tidak ada data untuk grafik dengan filter ini.</p>
              </div>
            </div>
          )}
          {!loading && !error && filteredData.length > 0 && (
            <canvas ref={chartRef} className="w-full h-full"></canvas>
          )}
        </div>
      </div>

      {/* --- Area Tampilan Data Historis (Tabel dengan Paginasi) --- */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V10z" />
            </svg>
            Tabel Data Historis
          </h3>
        </div>

        <div className="min-h-[400px]">
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Memuat data tabel...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-500 font-medium">Error: {error}</p>
              </div>
            </div>
          )}
          {!loading && !error && filteredData.length === 0 && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500">Tidak ada data yang ditemukan untuk filter ini.</p>
              </div>
            </div>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Medium Silinda (Rp/kg)
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Premium Silinda (Rp/kg)
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Medium Bapanas (Rp/kg)
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Premium Bapanas (Rp/kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((item, index) => (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          Rp {item.medium_silinda.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          Rp {item.premium_silinda.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          Rp {item.medium_bapanas.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          Rp {item.premium_bapanas.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Kontrol Paginasi */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} data
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

export default DataHistoris;