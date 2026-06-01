import type { SourceHealth } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface SourceStatusListProps {
  sources: SourceHealth[];
}

export function SourceStatusList({ sources }: SourceStatusListProps) {
  return (
    <section className="glass-panel rounded-[2rem] p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Fuentes Conectadas</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Cobertura actual</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sources.length === 0
          ? Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))
          : sources.map((source) => (
              <article key={source.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-white">{source.name}</h3>
                  <StatusBadge status={source.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{source.description}</p>
                <p className="mt-2 text-xs text-slate-600">{source.error ?? source.lastUpdated ?? "Awaiting check"}</p>
              </article>
            ))}
      </div>
    </section>
  );
}
