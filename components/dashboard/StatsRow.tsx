import { Activity, BadgeCheck, CircleDollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/api";
import { formatPercent, type ChartPoint } from "@/utils/dashboard";
import { PriceSparkline } from "@/components/charts/PriceSparkline";
import { StatCard } from "@/components/ui/StatCard";

export interface StatsRowProps {
  currentPrice: number | null;
  prediction: number | null;
  trendPercent: number | null;
  volatility: string | null;
  accuracy: number;
  model: string;
  sparkline: ChartPoint[];
  loading: boolean;
}

export function StatsRow({
  currentPrice,
  prediction,
  trendPercent,
  volatility,
  accuracy,
  model,
  sparkline,
  loading,
}: StatsRowProps) {
  const trendVariant = trendPercent === null ? "neutral" : trendPercent >= 0 ? "up" : "down";

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Ringkasan harga">
      <StatCard
        label="Harga Terakhir"
        value={formatCurrency(currentPrice)}
        detail="Data terbaru tersedia"
        icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />}
        sparkline={<PriceSparkline data={sparkline} />}
        loading={loading}
      />
      <StatCard
        label="Prediksi Berikutnya"
        value={formatCurrency(prediction)}
        detail="Dibanding data terakhir"
        icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
        trend={formatPercent(trendPercent)}
        trendVariant={trendVariant}
        sparkline={<PriceSparkline data={sparkline} />}
        loading={loading}
      />
      <StatCard
        label="Volatilitas"
        value={volatility ? `±${volatility}%` : "N/A"}
        detail="30 hari terakhir"
        icon={<Activity className="h-5 w-5" aria-hidden="true" />}
        loading={loading}
      />
      <StatCard
        label="Akurasi Model"
        value={`${accuracy.toFixed(1)}%`}
        detail={`${model} - 30d test`}
        icon={<BadgeCheck className="h-5 w-5" aria-hidden="true" />}
        trend="Model aktif"
        trendVariant="model"
        loading={loading}
      />
    </section>
  );
}

export default StatsRow;
