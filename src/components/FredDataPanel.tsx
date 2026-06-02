import type { MetricData } from "../types/market";
import { MetricCard } from "./MetricCard";

interface FredDataPanelProps {
  metrics: MetricData[];
}

export function FredDataPanel({ metrics }: FredDataPanelProps) {
  return (
    <section className="premium-panel rounded-[1.25rem] p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <p className="section-title">FRED data coverage</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Series macro y tasas disponibles desde FRED; errores/rate limits se mantienen visibles para decidir fuente alternativa.
          </p>
        </div>
        <a href="/macro" className="text-[10px] font-semibold text-emerald-300">Ver macro ›</a>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {metrics.length === 0
          ? Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-[112px] animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
            ))
          : metrics.map((metric) => <MetricCard key={metric.id} metric={metric} compact />)}
      </div>
    </section>
  );
}
