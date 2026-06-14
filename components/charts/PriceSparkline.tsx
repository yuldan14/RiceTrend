"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/utils/api";
import type { ChartPoint } from "@/utils/dashboard";

export interface PriceSparklineProps {
  data: ChartPoint[];
}

function SparklineTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-card">
      <p className="font-medium">{label}</p>
      <p className="font-medium tabular-nums">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function PriceSparkline({ data }: PriceSparklineProps) {
  return (
    <div className="h-12 min-w-0 w-full">
      <ResponsiveContainer width="100%" height={48}>
        <LineChart data={data}>
          <Tooltip content={SparklineTooltip} cursor={false} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-brand-500)"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceSparkline;
