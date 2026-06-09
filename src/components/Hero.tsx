import { ArrowRight, Search } from "lucide-react";
import type { MetricData } from "../types/market";

interface HeroProps {
  metrics: Record<string, MetricData>;
}

const tags = [
  { key: "sp500", label: "S&P 500" },
  { key: "tenYear", label: "US 10Y" },
  { key: "wti", label: "WTI" },
  { key: "gold", label: "Gold" },
  { key: "eurUsd", label: "EUR/USD" },
];

export function Hero({ metrics }: HeroProps) {
  return (
    <section className="premium-panel rounded-[1.25rem] p-5 sm:p-6 lg:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
        <div>
          <p className="section-title">NSC Insights</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Buenos días, NSC.</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-300">Mercados globales. Todas las señales. Una plataforma.</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Inteligencia en tiempo real para decisiones más rápidas y con mayor convicción.
          </p>
          <button className="mt-5 flex h-10 w-full max-w-sm items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 text-left text-[12px] text-slate-400 transition hover:border-[#5d8871] hover:text-white">
            <span className="flex items-center gap-2"><Search className="h-3.5 w-3.5" />¿Qué estás buscando hoy?</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-300">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => {
            const metric = metrics[tag.key];
            const value = metric ? `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}` : "--";
            const live = metric?.status === "online";
            return (
              <div key={tag.key} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{tag.label}</p>
                  <span className={live ? "h-2 w-2 rounded-full bg-[#5d8871]" : "h-2 w-2 rounded-full bg-slate-600"} />
                </div>
                <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                <p className="mt-1 truncate text-[10px] text-slate-600">{metric?.source ?? "Loading"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
