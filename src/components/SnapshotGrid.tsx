import type { MetricData } from "../types/market";
import { MetricCard } from "./MetricCard";

interface SnapshotGridProps {
  metrics: Record<string, MetricData>;
}

const snapshotKeys = [
  "sp500",
  "nasdaq",
  "tenYear",
  "sofr",
  "wti",
  "gold",
  "eurUsd",
  "publicDebt",
];

export function SnapshotGrid({ metrics }: SnapshotGridProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Market Snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Pulso institucional</h2>
        </div>
        <p className="hidden max-w-md text-right text-sm text-slate-500 md:block">
          Datos reales cuando estan disponibles; los vacios se exponen como X / Missing Data.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {snapshotKeys.map((key) => (
          <MetricCard key={key} metric={metrics[key]} />
        ))}
      </div>
    </section>
  );
}
