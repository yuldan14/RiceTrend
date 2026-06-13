"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency } from "@/utils/api";
import type { ForecastPoint } from "@/utils/dashboard";

export interface ForecastChartProps {
  data: ForecastPoint[];
}

function ForecastTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const values = payload.filter(
    (item) => item.dataKey === "historical" || item.dataKey === "forecast",
  );

  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-card">
      <p className="font-medium">{label}</p>
      {values.map((item) => (
        <p key={String(item.dataKey)} className="mt-1 font-mono">
          {item.dataKey === "historical" ? "Historis" : "Prediksi"}:{" "}
          {formatCurrency(Number(item.value))}
        </p>
      ))}
    </div>
  );
}

export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <div className="h-72 w-full" aria-label="Grafik historis dan prediksi tujuh hari">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={54}
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            domain={["dataMin - 300", "dataMax + 300"]}
          />
          <Tooltip content={<ForecastTooltip />} />
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="var(--color-brand-500)"
            fillOpacity={0.1}
            isAnimationActive
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="var(--color-surface)"
            fillOpacity={1}
            isAnimationActive
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="historical"
            stroke="var(--color-brand-500)"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="var(--color-brand-500)"
            strokeWidth={2.5}
            strokeDasharray="6 5"
            dot={{ r: 3, fill: "var(--color-brand-500)" }}
            connectNulls
            animationDuration={800}
          />
          <ReferenceLine
            x="Hari Ini"
            stroke="var(--color-muted)"
            strokeDasharray="4 4"
            label={{ value: "Hari Ini", fill: "var(--color-muted)", fontSize: 10 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ForecastChart;
