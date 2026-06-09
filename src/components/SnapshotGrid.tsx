import type { MetricData } from "../types/market";
import { MetricCard } from "./MetricCard";

interface SnapshotGridProps {
  metrics: Record<string, MetricData>;
}

const snapshotKeys = ["sp500", "nasdaq", "tenYear", "sofr", "wti", "gold", "eurUsd", "publicDebt"];

export function SnapshotGrid({ metrics }: SnapshotGridProps) {
  return (
    <section className="premium-panel rounded-[1.25rem] p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <p className="section-title">Resumen de mercado</p>
          <span className="text-[10px] text-slate-500">Actualizado 08:30 AM</span>
        </div>
        <a href="/mercados" className="text-[10px] font-semibold text-emerald-300">Ver todos los mercados ›</a>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-8">
        {snapshotKeys.map((key) => (
          <MetricCard key={key} metric={metrics[key]} compact />
        ))}
      </div>
    </section>
  );
}
