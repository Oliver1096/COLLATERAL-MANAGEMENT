import { Activity, Globe2, Radar } from "lucide-react";
import type { MetricData } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface HeroProps {
  metrics: Record<string, MetricData>;
}

const tagKeys = [
  { key: "tenYear", label: "US 10Y Yield" },
  { key: "eurUsd", label: "EUR/USD" },
  { key: "wti", label: "WTI" },
  { key: "sp500", label: "S&P 500" },
  { key: "gold", label: "Gold" },
  { key: "bitcoin", label: "Bitcoin" },
];

export function Hero({ metrics }: HeroProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="absolute right-10 top-10 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            <Radar className="h-3.5 w-3.5" />
            Internal Market Command Center
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
            Buenos días, NSC.
          </h1>
          <p className="mt-5 text-xl text-slate-200">Mercados globales. Todas las señales. Una plataforma.</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Inteligencia en tiempo real en clases de activos, datos macro e inversiones alternativas.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tagKeys.map((tag) => {
              const metric = metrics[tag.key];
              return (
                <div key={tag.key} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">{tag.label}</p>
                    <StatusBadge status={metric?.status ?? "loading"} />
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {metric ? `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}` : "--"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-panel relative min-h-[420px] overflow-hidden rounded-[2rem] p-6">
        <div className="map-grid absolute inset-0 opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/20" />
        <div className="absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/15" />
        <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/20 bg-emerald-400/5" />
        <Globe2 className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 text-emerald-200/90" />
        <div className="absolute left-[18%] top-[24%] rounded-full border border-emerald-300/30 bg-black/80 px-3 py-2 text-xs text-emerald-100">
          U.S. Rates
        </div>
        <div className="absolute right-[12%] top-[28%] rounded-full border border-white/15 bg-black/70 px-3 py-2 text-xs text-slate-100">
          Europe FX
        </div>
        <div className="absolute bottom-[22%] left-[12%] rounded-full border border-white/15 bg-black/70 px-3 py-2 text-xs text-slate-100">
          LatAm Macro
        </div>
        <div className="absolute bottom-[18%] right-[18%] rounded-full border border-emerald-300/30 bg-black/80 px-3 py-2 text-xs text-emerald-100">
          Energy
        </div>
        <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-300">
          <Activity className="h-3.5 w-3.5 text-emerald-300" />
          Live signal map
        </div>
      </div>
    </section>
  );
}
