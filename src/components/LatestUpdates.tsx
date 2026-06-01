import { Clock3 } from "lucide-react";
import type { LatestUpdate } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface LatestUpdatesProps {
  updates: LatestUpdate[];
}

export function LatestUpdates({ updates }: LatestUpdatesProps) {
  return (
    <section className="glass-panel rounded-[2rem] p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Latest Updates</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Ultimas lecturas importadas</h2>
      </div>
      <div className="space-y-3">
        {updates.length === 0
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))
          : updates.map((update) => (
              <div key={update.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{update.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      {update.timestamp ?? update.source}
                    </p>
                  </div>
                  <StatusBadge status={update.status} />
                </div>
                <p className="mt-2 text-sm text-emerald-200">{update.value}</p>
              </div>
            ))}
      </div>
    </section>
  );
}
