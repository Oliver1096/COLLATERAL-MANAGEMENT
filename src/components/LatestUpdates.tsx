import { ArrowRight, Clock3 } from "lucide-react";
import type { LatestUpdate } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface LatestUpdatesProps {
  updates: LatestUpdate[];
}

const tags = ["Mercados", "Economía", "Empresas", "Macro", "Energía"];

export function LatestUpdates({ updates }: LatestUpdatesProps) {
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">Últimas actualizaciones</p>
        <a href="/updates" className="text-[10px] font-semibold text-emerald-300">Ver más</a>
      </div>
      <div className="divide-y divide-white/10">
        {updates.length === 0
          ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-white/[0.04]" />)
          : updates.map((update, index) => (
              <div key={update.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-2.5 text-[11px]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-emerald-300">{tags[index % tags.length]}</span>
                    <p className="truncate text-slate-300">{update.title}</p>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-slate-500">{update.source} · {update.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[9px] text-slate-500 sm:inline">{update.timestamp ?? "hace 2 h"}</span>
                  <StatusBadge status={update.status} className="scale-75" />
                </div>
              </div>
            ))}
      </div>
      <a href="/updates" className="mt-3 flex items-center justify-center gap-2 text-[10px] font-semibold text-emerald-300">
        Ver todas las actualizaciones <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
