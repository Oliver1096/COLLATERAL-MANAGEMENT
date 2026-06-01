import { ArrowRight, Clock3 } from "lucide-react";
import type { LatestUpdate } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface LatestUpdatesProps {
  updates: LatestUpdate[];
}

export function LatestUpdates({ updates }: LatestUpdatesProps) {
  return (
    <section className="rounded-[1.4rem] border border-white/10 bg-[#07100e]/95 p-4 shadow-panel">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Últimas actualizaciones</p>
      <div className="divide-y divide-white/10">
        {updates.length === 0
          ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-white/[0.04]" />)
          : updates.map((update) => (
              <div key={update.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-slate-300">{update.source}</p>
                  <p className="truncate text-[11px] text-slate-500">{update.title} · {update.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden text-[10px] text-slate-500 sm:inline">{update.timestamp ?? "hace 2 h"}</span>
                  <StatusBadge status={update.status} className="scale-75" />
                </div>
              </div>
            ))}
      </div>
      <a href="/updates" className="mt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-300">
        Ver todas las actualizaciones <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
