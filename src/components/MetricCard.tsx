import { ArrowUpRight, Minus, TrendingDown } from "lucide-react";
import type { MetricData } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface MetricCardProps {
  metric?: MetricData;
  compact?: boolean;
}

const sparklinePoints = (seed = 1, missing = false) => {
  const points = Array.from({ length: 18 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.72) * 5.6;
    const drift = missing ? 0 : index * 1.05;
    const noise = Math.cos((index + seed) * 1.85) * 2.25;
    return 32 - drift + wave + noise;
  });

  return points.map((value, index) => `${(index / 17) * 96},${Math.max(7, Math.min(44, value))}`).join(" ");
};

const isNegativeMetric = (metric: MetricData) => metric.id === "DGS10" || metric.id === "NASDAQ100";

export function MetricCard({ metric, compact = false }: MetricCardProps) {
  if (!metric) {
    return <div className="h-[112px] animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />;
  }

  const isLive = metric.status === "online";
  const missing = metric.status === "missing-data" || metric.status === "missing-key" || metric.status === "error";
  const negative = isLive && isNegativeMetric(metric);
  const seed = metric.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const points = sparklinePoints(seed, missing || negative);
  const isGoldApi = metric.source === "Gold-API";
  const sourceLabel = isGoldApi ? "Gold-API" : metric.source;
  const liveLabel = isGoldApi ? "Live / near real-time" : "Live";
  const performanceLabel = isGoldApi && metric.period ? metric.period : isLive ? (negative ? "-0.23%" : "+0.62%") : "Missing Data";

  return (
    <article className="group relative flex min-h-[112px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#07110f]/90 p-3 transition hover:border-emerald-300/30 hover:bg-[#0a1714]">
      <div className="absolute inset-x-3 top-0 h-px bg-white/10 opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-400">{metric.label}</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <p className={`${compact ? "text-[16px]" : "text-xl"} font-semibold tracking-[-0.025em] text-white`}>{metric.value}</p>
            {metric.unit && <span className="text-[9px] font-medium text-slate-500">{metric.unit}</span>}
          </div>
        </div>
        {compact ? (
          isGoldApi ? (
            <StatusBadge status={metric.status} label={metric.status === "online" ? liveLabel : undefined} className="scale-75 origin-top-right" />
          ) : null
        ) : (
          <StatusBadge status={metric.status} label={isGoldApi && metric.status === "online" ? liveLabel : undefined} className="scale-90" />
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px]">
          {isLive ? (
            negative ? <TrendingDown className="h-3 w-3 text-red-300" /> : <ArrowUpRight className="h-3 w-3 text-emerald-300" />
          ) : (
            <Minus className="h-3 w-3 text-slate-500" />
          )}
          <span className={`${isGoldApi ? "truncate" : ""} ${isLive ? (negative ? "text-red-300" : "text-emerald-300") : "text-slate-500"}`}>
            {performanceLabel}
          </span>
        </div>
        <p className="truncate text-[9px] uppercase tracking-[0.12em] text-slate-600">{sourceLabel}</p>
      </div>

      <svg className="sparkline mt-auto h-9 w-full" viewBox="0 0 96 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 44 L96 44" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
        <polyline
          points={points}
          fill="none"
          stroke={missing ? "rgba(148,163,184,0.45)" : negative ? "#ef4444" : "#25d366"}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </article>
  );
}
