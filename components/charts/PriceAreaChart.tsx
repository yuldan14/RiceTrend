"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/utils/api";
import type { ChartPoint } from "@/utils/dashboard";

export interface PriceAreaChartProps {
  data: ChartPoint[];
}

function AreaTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-card">
      <p>{label}</p>
      <p className="mt-1 font-mono font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function PriceAreaChart({ data }: PriceAreaChartProps) {
  return (
    <div className="h-44 min-w-0 w-full" aria-label="Grafik harga 30 hari">
      <ResponsiveContainer width="100%" height={176}>
        <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip content={AreaTooltip} cursor={{ stroke: "var(--color-border)" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-brand-500)"
            strokeWidth={2.5}
            fill="url(#priceFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-brand-500)", stroke: "white", strokeWidth: 2 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceAreaChart;
