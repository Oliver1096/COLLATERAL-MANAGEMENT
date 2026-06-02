import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "../StatusBadge";

const statusLabel = (status) => {
  if (status === "online") return "Live";
  if (status === "partial") return "Partial";
  if (status === "mock") return "Mock";
  if (status === "missing-data") return "Missing";
  return undefined;
};

const sparkline = (seed = 1, muted = false) =>
  Array.from({ length: 16 }, (_, index) => {
    const value = 30 - index * (muted ? 0.1 : 0.75) + Math.sin((index + seed) * 0.92) * 6;
    return `${(index / 15) * 88},${Math.max(8, Math.min(40, value))}`;
  }).join(" ");

export function FixedIncomeModuleCard({ card }) {
  const seed = card.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const live = card.status === "online";
  const partial = card.status === "partial";
  const stroke = live ? "#25d366" : partial ? "#bef264" : "rgba(148,163,184,0.42)";

  return (
    <article className="group relative min-h-[184px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/35 hover:bg-emerald-400/10 hover:shadow-[0_22px_60px_rgba(0,0,0,0.34)]">
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">{card.category}</p>
          <h3 className="mt-2 text-base font-semibold tracking-[-0.02em] text-white">{card.title}</h3>
        </div>
        <StatusBadge status={card.status} label={statusLabel(card.status)} className="scale-75 origin-top-right" />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-white">{card.mainMetric}</p>
          {card.subMetric && <p className="mt-1 text-[11px] text-slate-400">{card.subMetric}</p>}
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-emerald-300" />
      </div>

      <svg className="mt-4 h-10 w-full" viewBox="0 0 88 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 42 L88 42" stroke="rgba(148,163,184,0.1)" />
        <polyline points={sparkline(seed, !live)} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="mt-3 flex items-center justify-between gap-3 text-[10px]">
        <span className="truncate uppercase tracking-[0.14em] text-slate-600">{card.source}</span>
        <span className="text-slate-500">{card.availability}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 flex translate-y-3 flex-col justify-end bg-gradient-to-t from-[#03100c] via-[#03100c]/92 to-transparent p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-[11px] font-semibold text-white">Qué mostrará</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-300">{card.details}</p>
        <p className="mt-2 text-[10px] text-emerald-300">Disponible: {card.availableData}</p>
        <p className="mt-1 text-[10px] text-amber-200">Falta: {card.missingData}</p>
      </div>
    </article>
  );
}
