"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { TooltipProps } from "recharts";
import { formatCurrency } from "@/utils/api";
import type { ChartPoint } from "@/utils/dashboard";

export interface PriceSparklineProps {
  data: ChartPoint[];
}

function SparklineTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0].value);

  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-card">
      <p className="font-medium">{label}</p>
      <p className="font-mono">{formatCurrency(value)}</p>
    </div>
  );
}

export function PriceSparkline({ data }: PriceSparklineProps) {
  return (
    <div className="h-12 w-[72px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip content={<SparklineTooltip />} cursor={false} />
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
