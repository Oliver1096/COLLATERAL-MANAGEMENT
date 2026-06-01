import { ArrowUpRight, Minus } from "lucide-react";
import type { MetricData } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface MetricCardProps {
  metric?: MetricData;
  compact?: boolean;
}

export function MetricCard({ metric, compact = false }: MetricCardProps) {
  if (!metric) {
    return <div className="h-36 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />;
  }

  const isLive = metric.status === "online";

  return (
    <article className="glass-panel group relative overflow-hidden rounded-3xl p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/30">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">{metric.label}</p>
          <div className="mt-3 flex items-end gap-2">
            <p className={`${compact ? "text-2xl" : "text-3xl"} font-semibold tracking-tight text-white`}>
              {metric.value}
            </p>
            {metric.unit && <span className="mb-1 text-xs font-medium text-slate-500">{metric.unit}</span>}
          </div>
        </div>
        <StatusBadge status={metric.status} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isLive ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" /> : <Minus className="h-3.5 w-3.5" />}
          <span>{metric.period ?? metric.error ?? "Awaiting provider"}</span>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-600">{metric.source}</p>
      </div>
    </article>
  );
}
