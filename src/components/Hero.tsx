import { ArrowRight, Search } from "lucide-react";
import type { MetricData } from "../types/market";

interface HeroProps {
  metrics: Record<string, MetricData>;
}

const tags = [
  { key: "tenYear", label: "US 10Y Yield", className: "left-[36%] top-[14%]" },
  { key: "eurUsd", label: "EUR/USD", className: "left-[55%] top-[28%]" },
  { key: "wti", label: "Brent Oil", className: "right-[8%] top-[20%]" },
  { key: "sp500", label: "S&P 500", className: "left-[42%] top-[57%]" },
  { key: "gold", label: "Gold", className: "right-[23%] top-[60%]" },
  { key: "bitcoin", label: "Bitcoin", className: "right-[3%] top-[66%]" },
];

const tagChange = (key: string, status?: string) => {
  if (status !== "online") return "Missing";
  const changes: Record<string, string> = { tenYear: "-2.3bp", eurUsd: "+0.23%", wti: "+1.42%", sp500: "+0.62%", gold: "+0.88%" };
  return changes[key] ?? "-1.21%";
};

export function Hero({ metrics }: HeroProps) {
  return (
    <section className="relative min-h-[171px] overflow-hidden border-b border-white/10 bg-[#020706] px-5 py-5 sm:px-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_46%,rgba(37,211,102,0.15),transparent_26%),linear-gradient(90deg,rgba(2,7,6,1)_0%,rgba(2,7,6,0.94)_34%,rgba(2,7,6,0.18)_78%,rgba(2,7,6,0.5)_100%)]" />
      <div className="earth-sphere hidden md:block">
        <span className="earth-continent continent-na" />
        <span className="earth-continent continent-sa" />
        <span className="earth-continent continent-eu" />
        <span className="earth-continent continent-af" />
        <span className="earth-continent continent-asia" />
        <span className="earth-continent continent-au" />
        <span className="earth-lights" />
      </div>

      <div className="relative z-10 max-w-[340px]">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[32px]">Buenos días, NSC.</h1>
        <p className="mt-2.5 text-sm text-slate-300">
          Mercados globales. <span className="text-emerald-300">Todas las señales.</span> Una plataforma.
        </p>
        <p className="mt-3 max-w-[285px] text-[11px] leading-5 text-slate-400">
          Inteligencia en tiempo real en clases de activos, datos macro e inversiones alternativas.
        </p>
        <button className="mt-4 flex h-9 w-[246px] items-center justify-between rounded-lg border border-white/10 bg-white/[0.055] px-3 text-left text-[11px] text-slate-400 transition hover:border-emerald-300/30 hover:text-white">
          <span className="flex items-center gap-2"><Search className="h-3.5 w-3.5" />¿Qué estás buscando hoy?</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-slate-300">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
        {tags.map((tag) => {
          const metric = metrics[tag.key];
          const value = metric ? `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}` : "--";
          const change = tagChange(tag.key, metric?.status);
          const positive = !change.startsWith("-") && change !== "Missing";
          return (
            <div key={tag.key} className={`market-pin absolute min-w-[88px] rounded-md border border-white/10 bg-[#07100f]/88 px-2.5 py-2 backdrop-blur-sm ${tag.className}`}>
              <p className="text-[10px] font-medium text-slate-300">{tag.label}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold text-white">{value}</p>
                <p className={positive ? "text-[10px] font-semibold text-emerald-300" : "text-[10px] font-semibold text-red-300"}>{change}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
