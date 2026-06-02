import { ArrowUpRight, Minus, TrendingDown } from "lucide-react";
import { StatusBadge } from "../StatusBadge";

const pointsFor = (seed = 1, inactive = false) =>
  Array.from({ length: 18 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.68) * 5.8;
    const drift = inactive ? 0 : index * 0.9;
    const value = 32 - drift + wave + Math.cos((index + seed) * 1.7) * 2.1;
    return `${(index / 17) * 96},${Math.max(7, Math.min(44, value))}`;
  }).join(" ");

const statusLabel = (status) => {
  if (status === "online") return "Live";
  if (status === "partial") return "Partial";
  if (status === "missing-data") return "Missing";
  return undefined;
};

export function FixedIncomePulseCard({ metric, change, detail }) {
  const isLive = metric?.status === "online";
  const isNegative = typeof change === "string" && change.trim().startsWith("-");
  const seed = (metric?.id ?? metric?.label ?? "fi").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const inactive = !isLive;

  return (
    <article className="group relative flex min-h-[132px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#07110f]/92 p-3.5 transition hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-[#0b1714]">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{metric?.label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className="text-xl font-semibold tracking-[-0.03em] text-white">{metric?.value ?? "X"}</p>
            {metric?.unit && <span className="text-[10px] text-slate-500">{metric.unit}</span>}
          </div>
        </div>
        <StatusBadge status={metric?.status ?? "loading"} label={statusLabel(metric?.status)} className="scale-75 origin-top-right" />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
        <span className={`flex min-w-0 items-center gap-1.5 ${isLive ? (isNegative ? "text-red-300" : "text-emerald-300") : "text-slate-500"}`}>
          {isLive ? (isNegative ? <TrendingDown className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />) : <Minus className="h-3 w-3" />}
          <span className="truncate">{isLive ? change ?? metric?.period ?? "Latest" : metric?.error ?? "Missing Data"}</span>
        </span>
        <span className="shrink-0 uppercase tracking-[0.12em] text-slate-600">{metric?.source}</span>
      </div>

      <svg className="sparkline mt-auto h-9 w-full" viewBox="0 0 96 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 44 L96 44" stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
        <polyline
          points={pointsFor(seed, inactive)}
          fill="none"
          stroke={inactive ? "rgba(148,163,184,0.45)" : isNegative ? "#ef4444" : "#25d366"}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {detail && <p className="mt-2 line-clamp-1 text-[10px] text-slate-500">{detail}</p>}
    </article>
  );
}
