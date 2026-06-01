import { ArrowRight, Activity, Search } from "lucide-react";
import type { MetricData } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface HeroProps {
  metrics: Record<string, MetricData>;
}

const tags = [
  { key: "tenYear", label: "US 10Y Yield", className: "left-[45%] top-[16%]" },
  { key: "eurUsd", label: "EUR/USD", className: "left-[62%] top-[28%]" },
  { key: "wti", label: "Brent Oil", className: "right-[8%] top-[20%]" },
  { key: "sp500", label: "S&P 500", className: "left-[52%] top-[50%]" },
  { key: "gold", label: "Gold", className: "right-[18%] top-[58%]" },
  { key: "bitcoin", label: "Bitcoin", className: "right-[3%] top-[64%]" },
];

export function Hero({ metrics }: HeroProps) {
  return (
    <section className="relative min-h-[365px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#030807] p-5 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_38%,rgba(37,211,102,0.16),transparent_32%),linear-gradient(90deg,rgba(3,8,7,0.98)_0%,rgba(3,8,7,0.82)_38%,rgba(3,8,7,0.2)_100%)]" />
      <div className="earth-sphere hidden md:block" />

      <div className="relative z-10 max-w-[360px] pt-5">
        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">Buenos días, NSC.</h1>
        <p className="mt-4 text-sm text-slate-300 sm:text-base">
          Mercados globales. <span className="text-emerald-300">Todas las señales.</span> Una plataforma.
        </p>
        <p className="mt-4 text-xs leading-5 text-slate-400 sm:text-sm">
          Inteligencia en tiempo real en clases de activos, datos macro e inversiones alternativas.
        </p>
        <button className="mt-7 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-left text-xs text-slate-400 transition hover:border-emerald-300/30 hover:text-white sm:text-sm">
          <span className="flex items-center gap-2"><Search className="h-4 w-4" />¿Qué estás buscando hoy?</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-slate-300">
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
        {tags.map((tag) => {
          const metric = metrics[tag.key];
          const value = metric ? `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}` : "--";
          return (
            <div key={tag.key} className={`market-pin absolute rounded-xl border border-white/10 bg-[#08100f]/90 px-3 py-2 backdrop-blur ${tag.className}`}>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold text-slate-300">{tag.label}</p>
                {metric && <StatusBadge status={metric.status} className="scale-75" />}
              </div>
              <p className="mt-1 text-xs font-semibold text-white">{value}</p>
            </div>
          );
        })}
        <div className="absolute right-7 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
          <Activity className="h-3.5 w-3.5 text-emerald-300" /> Live global map
        </div>
      </div>
    </section>
  );
}
