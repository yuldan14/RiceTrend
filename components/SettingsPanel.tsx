"use client";

import { useEffect, useState } from "react";
import { BellRing, Clock3, Save, Scale } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { notifySuccess } from "@/components/ui/Toast";
import { cn } from "@/utils/style";

type RefreshInterval = 0 | 1 | 5 | 15;
type UnitPreference = "kg" | "ton";

const refreshOptions: Array<{ value: RefreshInterval; label: string }> = [
  { value: 1, label: "1 menit" },
  { value: 5, label: "5 menit" },
  { value: 15, label: "15 menit" },
  { value: 0, label: "Manual" },
];

export function SettingsPanel() {
  const [interval, setIntervalValue] = useState<RefreshInterval>(5);
  const [unit, setUnit] = useState<UnitPreference>("kg");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [threshold, setThreshold] = useState(3);

  useEffect(() => {
    const storedInterval = Number(
      window.localStorage.getItem("ricetrend-refresh-interval") ?? "5",
    ) as RefreshInterval;
    const storedUnit = window.localStorage.getItem("ricetrend-unit") as UnitPreference | null;
    const storedAlerts = window.localStorage.getItem("ricetrend-alert-enabled");
    const storedThreshold = Number(
      window.localStorage.getItem("ricetrend-alert-threshold") ?? "3",
    );

    if ([0, 1, 5, 15].includes(storedInterval)) setIntervalValue(storedInterval);
    if (storedUnit === "kg" || storedUnit === "ton") setUnit(storedUnit);
    if (storedAlerts !== null) setAlertsEnabled(storedAlerts === "true");
    if (Number.isFinite(storedThreshold)) setThreshold(storedThreshold);
  }, []);

  const handleSave = () => {
    window.localStorage.setItem("ricetrend-refresh-interval", String(interval));
    window.localStorage.setItem("ricetrend-unit", unit);
    window.localStorage.setItem("ricetrend-alert-enabled", String(alertsEnabled));
    window.localStorage.setItem("ricetrend-alert-threshold", String(threshold));
    notifySuccess("Pengaturan disimpan");
  };

  return (
    <>
      <PageHeader
        title="Pengaturan"
        subtitle="Atur pembaruan data, satuan harga, dan ambang notifikasi."
        actions={
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Simpan
          </button>
        }
      />

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-card border border-border bg-white p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Interval Pembaruan</h2>
              <p className="mt-1 text-sm text-muted">Frekuensi data dimuat ulang otomatis.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group">
            {refreshOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setIntervalValue(option.value)}
                className={cn(
                  "h-10 rounded-xl border text-sm font-semibold transition",
                  interval === option.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border bg-white text-slate-600 hover:border-brand-500",
                )}
                aria-pressed={interval === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-border bg-white p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Satuan Harga</h2>
              <p className="mt-1 text-sm text-muted">Satuan utama saat membaca nilai harga.</p>
            </div>
          </div>
          <div className="mt-5 inline-flex rounded-xl border border-border bg-surface p-1">
            {(["kg", "ton"] as UnitPreference[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setUnit(value)}
                className={cn(
                  "h-9 min-w-24 rounded-lg px-4 text-sm font-semibold transition",
                  unit === value ? "bg-white text-brand-700 shadow-sm" : "text-muted",
                )}
                aria-pressed={unit === value}
              >
                Per {value}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-border bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <BellRing className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">Peringatan Harga</h2>
                <p className="mt-1 text-sm text-muted">Tandai perubahan harian melewati ambang.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlertsEnabled((value) => !value)}
              className={cn(
                "relative h-7 w-12 rounded-pill transition",
                alertsEnabled ? "bg-brand-500" : "bg-slate-300",
              )}
              role="switch"
              aria-checked={alertsEnabled}
              aria-label="Aktifkan peringatan harga"
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
                  alertsEnabled ? "left-6" : "left-1",
                )}
              />
            </button>
          </div>

          <label className="mt-6 block">
            <span className="flex items-center justify-between text-sm font-medium text-slate-700">
              Ambang perubahan
              <span className="font-bold text-brand-700 tabular-nums">{threshold}%</span>
            </span>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              disabled={!alertsEnabled}
              className="mt-4 w-full accent-brand-500 disabled:opacity-40"
            />
          </label>
        </section>
      </div>
    </>
  );
}

export default SettingsPanel;
