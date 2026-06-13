import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/api";
import { getModelMetricRows } from "@/utils/dashboard";

export interface ModelComparisonCardProps {
  model: "ARIMA" | "Prophet" | "LSTM";
  predictions: number[];
  recommended?: boolean;
}

export function ModelComparisonCard({
  model,
  predictions,
  recommended = false,
}: ModelComparisonCardProps) {
  const metrics = getModelMetricRows(model);

  return (
    <article className="rounded-card border border-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{model}</h2>
          <p className="mt-1 text-xs text-muted">
            {model === "Prophet" ? "Benchmark gabungan" : "Model prediksi lokal"}
          </p>
        </div>
        {recommended ? <Badge variant="model">Rekomendasi</Badge> : <Badge>{model}</Badge>}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          ["MAE", metrics.mae],
          ["RMSE", metrics.rmse],
          ["MAPE", `${metrics.mape}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">Akurasi</span>
          <span className="font-mono font-bold text-brand-700">{metrics.accuracy}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-pill bg-brand-100">
          <div
            className={
              metrics.accuracy >= 94
                ? "h-full w-[95%] rounded-pill bg-brand-500"
                : metrics.accuracy >= 93
                  ? "h-full w-[94%] rounded-pill bg-brand-500"
                  : "h-full w-[93%] rounded-pill bg-brand-500"
            }
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Hari</th>
              <th className="px-3 py-2 text-right font-semibold">Prediksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {predictions.slice(0, 7).map((value, index) => (
              <tr key={`${model}-${index}`} className="text-slate-700">
                <td className="px-3 py-2">H+{index + 1}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {formatCurrency(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default ModelComparisonCard;
