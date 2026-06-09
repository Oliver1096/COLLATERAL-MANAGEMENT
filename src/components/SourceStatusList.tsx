import type { SourceHealth } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface SourceStatusListProps {
  sources: SourceHealth[];
}

export function SourceStatusList({ sources }: SourceStatusListProps) {
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="section-title">Fuentes Conectadas</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-white">Cobertura actual</h2>
        </div>
        <p className="hidden text-[11px] text-slate-500 sm:block">Estado operativo de APIs y fuentes externas</p>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {sources.length === 0
          ? Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
            ))
          : sources.map((source) => (
              <article key={source.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-emerald-300/25">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{source.name}</h3>
                  <StatusBadge status={source.status} className="scale-90" />
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-400">{source.description}</p>
                <p className="mt-2 truncate text-[10px] text-slate-600">{source.error ?? source.lastUpdated ?? "Awaiting check"}</p>
              </article>
            ))}
      </div>
    </section>
  );
}
