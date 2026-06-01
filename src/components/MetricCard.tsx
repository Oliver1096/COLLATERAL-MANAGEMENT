import { ArrowUpRight, Minus } from "lucide-react";
import type { MetricData } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface MetricCardProps {
  metric?: MetricData;
  compact?: boolean;
}

const sparklinePoints = (seed = 1, missing = false) => {
  const points = Array.from({ length: 18 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.75) * 6;
    const drift = missing ? 0 : index * 1.15;
    const noise = Math.cos((index + seed) * 1.9) * 2.4;
    return 32 - drift + wave + noise;
  });

  return points.map((value, index) => `${(index / 17) * 96},${Math.max(7, Math.min(44, value))}`).join(" ");
};

export function MetricCard({ metric, compact = false }: MetricCardProps) {
  if (!metric) {
    return <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />;
  }

  const isLive = metric.status === "online";
  const missing = metric.status === "missing-data" || metric.status === "missing-key" || metric.status === "error";
  const seed = metric.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const points = sparklinePoints(seed, missing);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#08110f]/90 p-3 transition hover:border-emerald-300/30 hover:bg-[#0b1714]">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-slate-400">{metric.label}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <p className={`${compact ? "text-lg" : "text-xl"} font-semibold tracking-tight text-white`}>{metric.value}</p>
            {metric.unit && <span className="text-[10px] font-medium text-slate-500">{metric.unit}</span>}
          </div>
        </div>
        {compact ? null : <StatusBadge status={metric.status} className="scale-90" />}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          {isLive ? <ArrowUpRight className="h-3 w-3 text-emerald-300" /> : <Minus className="h-3 w-3 text-slate-500" />}
          <span className={isLive ? "text-emerald-300" : "text-slate-500"}>
            {isLive ? metric.period ?? "Live" : "Missing Data"}
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">{metric.source}</p>
      </div>

      <svg className="sparkline mt-2 h-9 w-full" viewBox="0 0 96 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 44 L96 44" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
        <polyline
          points={points}
          fill="none"
          stroke={missing ? "rgba(148,163,184,0.45)" : "#25d366"}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </article>
  );
}
