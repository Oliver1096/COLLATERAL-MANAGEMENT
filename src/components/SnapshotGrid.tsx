import type { MetricData } from "../types/market";
import { MetricCard } from "./MetricCard";

interface SnapshotGridProps {
  metrics: Record<string, MetricData>;
}

const snapshotKeys = ["sp500", "nasdaq", "tenYear", "sofr", "wti", "gold", "eurUsd", "publicDebt"];

export function SnapshotGrid({ metrics }: SnapshotGridProps) {
  return (
    <section className="rounded-[1.4rem] border border-white/10 bg-[#07100e]/95 p-3 shadow-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Resumen de mercado</p>
          <span className="text-[11px] text-slate-500">A las 9:30 AM ET</span>
        </div>
        <p className="text-[11px] text-slate-500">Live APIs + estados Missing Data</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-8">
        {snapshotKeys.map((key) => (
          <MetricCard key={key} metric={metrics[key]} compact />
        ))}
      </div>
    </section>
  );
}
