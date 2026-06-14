"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { notifyError, notifySuccess } from "@/components/ui/Toast";
import {
  RICE_CATEGORIES,
  formatCurrency,
  getHistoricalPrices,
  type HistoricalPriceData,
  type RiceCategory,
} from "@/utils/api";
import { exportCsv } from "@/utils/dashboard";

interface HistoricalTableRow {
  id: string;
  date: string;
  category: RiceCategory;
  label: string;
  price: number;
  change: number | null;
  source: string;
}

const pageSize = 12;

export function DataHistoris() {
  const [rows, setRows] = useState<HistoricalPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const data = await getHistoricalPrices();
        setRows(data);
        if (data.length > 0) {
          setStartDate(data[Math.max(0, data.length - 90)].date);
          setEndDate(data[data.length - 1].date);
        }
      } catch (loadError: unknown) {
        const message =
          loadError instanceof Error ? loadError.message : "Data gagal dimuat.";
        setError(message);
        notifyError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const tableRows = useMemo<HistoricalTableRow[]>(() => {
    const flattened: HistoricalTableRow[] = [];

    rows.forEach((row, index) => {
      RICE_CATEGORIES.forEach((category) => {
        const price = row[category.id];
        const previous = index > 0 ? rows[index - 1][category.id] : null;

        if (typeof price !== "number") return;

        const change =
          typeof previous === "number" && previous !== 0
            ? ((price - previous) / previous) * 100
            : null;

        flattened.push({
          id: `${row.id}-${category.id}`,
          date: row.date,
          category: category.id,
          label: category.label,
          price,
          change,
          source: "Data harga lokal",
        });
      });
    });

    return flattened.reverse();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tableRows.filter(
      (row) =>
        (!startDate || row.date >= startDate) &&
        (!endDate || row.date <= endDate) &&
        (!normalizedQuery || row.label.toLowerCase().includes(normalizedQuery)),
    );
  }, [endDate, query, startDate, tableRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const chartRows = useMemo(
    () =>
      rows
        .filter(
          (row) =>
            (!startDate || row.date >= startDate) &&
            (!endDate || row.date <= endDate),
        )
        .slice(-45)
        .map((row) => ({
          ...row,
          label: format(parseISO(row.date), "dd MMM"),
        })),
    [endDate, rows, startDate],
  );

  useEffect(() => {
    setPage(1);
  }, [query, startDate, endDate]);

  const handleExport = () => {
    const exported = exportCsv(
      `ricetrend-historis-${endDate || "data"}.csv`,
      filteredRows.map((row) => ({
        tanggal: row.date,
        jenis_beras: row.label,
        harga: row.price,
        perubahan_persen: row.change?.toFixed(2) ?? "",
        sumber: row.source,
      })),
    );

    if (exported) notifySuccess("Data berhasil diekspor");
  };

  return (
    <>
      <PageHeader
        title="Data Historis"
        subtitle={`${filteredRows.length.toLocaleString("id-ID")} baris harga tersedia untuk analisis.`}
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        }
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-card border border-border bg-white p-4 shadow-card sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_180px_180px_auto] lg:items-end">
            <label className="min-w-0 space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Cari Jenis Beras
              </span>
              <span className="relative block">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Contoh: Premium"
                  className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm"
                />
              </span>
            </label>
            <label className="min-w-0 space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Dari
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-sm text-slate-800"
              />
            </label>
            <label className="min-w-0 space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                Sampai
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-sm text-slate-800"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                if (rows.length > 0) {
                  setStartDate(rows[Math.max(0, rows.length - 90)].date);
                  setEndDate(rows[rows.length - 1].date);
                }
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 xl:flex-none"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-card border border-border bg-white p-5 shadow-card sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Pergerakan Harga
            </h2>
            <p className="mt-1 text-xs text-muted">
              45 titik terakhir dalam rentang filter
            </p>
          </div>
          {loading ? (
            <Skeleton className="mt-5 h-72 w-full" />
          ) : (
            <div className="mt-5 h-72 min-w-0">
              <ResponsiveContainer width="100%" height={288}>
                <LineChart data={chartRows}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                    tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                    tickFormatter={(value: number) =>
                      `${Math.round(value / 1000)}k`
                    }
                  />
                  <Tooltip />
                  <Line
                    dataKey="medium_silinda"
                    name="Medium Silinda"
                    stroke="var(--color-brand-500)"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="premium_silinda"
                    name="Premium Silinda"
                    stroke="var(--color-amber-500)"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="medium_bapanas"
                    name="Medium Bapanas"
                    stroke="var(--color-slate-700)"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="premium_bapanas"
                    name="Premium Bapanas"
                    stroke="var(--color-rose-500)"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
          {loading && (
            <div className="space-y-3 p-6" aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!loading && error && (
            <EmptyState
              title="Data historis gagal dimuat"
              description={error}
              className="p-8"
            />
          )}

          {!loading && !error && visibleRows.length === 0 && (
            <EmptyState
              title="Data tidak ditemukan"
              description="Ubah jenis beras atau rentang tanggal untuk melihat hasil."
              className="p-8"
            />
          )}

          {!loading && !error && visibleRows.length > 0 && (
            <>
              <div className="max-h-[560px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-200">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tanggal</th>
                      <th className="px-5 py-3 font-semibold">Jenis Beras</th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Harga
                      </th>
                      <th className="px-5 py-3 font-semibold">Perubahan</th>
                      <th className="px-5 py-3 font-semibold">Sumber</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleRows.map((row) => {
                      const variant =
                        row.change === null
                          ? "neutral"
                          : row.change > 0
                            ? "up"
                            : row.change < 0
                              ? "down"
                              : "neutral";

                      return (
                        <tr key={row.id} className="hover:bg-brand-50/50">
                          <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">
                            {format(parseISO(row.date), "dd MMM yyyy")}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                            {row.label}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(row.price)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3">
                            <Badge variant={variant}>
                              {row.change === null
                                ? "N/A"
                                : `${row.change > 0 ? "+" : ""}${row.change.toFixed(2)}%`}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-muted">
                            {row.source}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted">
                  Menampilkan {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, filteredRows.length)} dari{" "}
                  {filteredRows.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1}
                    className="h-9 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <span className="min-w-24 text-center text-xs font-medium text-muted">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-9 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-40 cursor-pointer"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default DataHistoris;
