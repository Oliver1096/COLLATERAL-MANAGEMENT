import { ArrowRight, Search } from "lucide-react";
import type { MetricData } from "../types/market";

interface HeroProps {
  metrics: Record<string, MetricData>;
}

const tags = [
  { key: "sp500", label: "S&P 500", className: "left-[44%] top-[24%]" },
  { key: "tenYear", label: "US 10Y Yield", className: "left-[41%] top-[55%]" },
  { key: "wti", label: "Brent Oil", className: "right-[4%] top-[22%]" },
  { key: "gold", label: "Oro (XAU)", className: "right-[3%] top-[58%]" },
  { key: "eurUsd", label: "EUR/USD", className: "left-[62%] top-[65%]" },
];

const tagChange = (key: string, status?: string) => {
  if (status !== "online") return "Missing";
  const changes: Record<string, string> = { sp500: "+0.62%", tenYear: "-2.3bp", wti: "+1.22%", gold: "+0.74%", eurUsd: "+0.18%" };
  return changes[key] ?? "+0.21%";
};

export function Hero({ metrics }: HeroProps) {
  return (
    <section className="premium-panel relative min-h-[194px] overflow-hidden rounded-[1.35rem] px-5 py-5 sm:px-6 lg:px-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_66%_46%,rgba(37,211,102,0.2),transparent_29%),linear-gradient(90deg,rgba(2,7,6,0.98)_0%,rgba(2,7,6,0.9)_34%,rgba(2,7,6,0.24)_74%,rgba(2,7,6,0.72)_100%)]" />
      <div className="hero-globe hidden md:block">
        <span className="earth-continent continent-na" />
        <span className="earth-continent continent-sa" />
        <span className="earth-continent continent-eu" />
        <span className="earth-continent continent-af" />
        <span className="earth-continent continent-asia" />
        <span className="earth-continent continent-au" />
        <span className="earth-lights" />
      </div>
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />

      <div className="relative z-10 max-w-[390px] pt-1">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.045em] text-white sm:text-[38px]">Buenos días, NSC.</h1>
        <p className="mt-3 text-sm font-medium text-slate-300">
          Mercados globales. <span className="text-emerald-300">Todas las señales.</span> Una plataforma.
        </p>
        <p className="mt-3 max-w-[330px] text-[11px] leading-5 text-slate-400">
          Inteligencia en tiempo real para decisiones más rápidas y con mayor convicción.
        </p>
        <button className="mt-4 flex h-9 w-[260px] items-center justify-between rounded-lg border border-white/10 bg-black/28 px-3 text-left text-[11px] text-slate-400 transition hover:border-emerald-300/30 hover:bg-white/[0.055] hover:text-white">
          <span className="flex items-center gap-2"><Search className="h-3.5 w-3.5" />¿Qué estás buscando hoy?</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.08] text-slate-300">
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
            <div key={tag.key} className={`market-pin absolute min-w-[104px] rounded-lg border border-white/10 bg-[#07100f]/78 px-3 py-2 backdrop-blur-md ${tag.className}`}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">{tag.label}</p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
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
