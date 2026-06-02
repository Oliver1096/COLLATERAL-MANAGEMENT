import { ArrowUpRight, Clock3, Database, Info, Minus } from "lucide-react";
import { StatusBadge } from "../StatusBadge";

const statusForBadge = (status) => {
  if (status === "online") return "online";
  if (status === "missing-key") return "missing-key";
  if (status === "error") return "error";
  return "missing-data";
};

const pointsFor = (values = [], inactive = false) => {
  const source = values.length > 1 ? values : [28, 30, 27, 31, 29, 32, 30, 34];
  const min = Math.min(...source);
  const max = Math.max(...source);
  const range = max - min || 1;
  return source
    .map((value, index) => {
      const x = (index / Math.max(source.length - 1, 1)) * 96;
      const y = 42 - ((value - min) / range) * 28;
      return `${x},${inactive ? 34 + Math.sin(index) * 2 : y}`;
    })
    .join(" ");
};

export function FixedIncomePulseCard({ rate }) {
  const live = rate.status === "online";
  const inactive = !live;
  const valueLabel = live ? `${rate.displayValue}%` : "Data unavailable";
  const stroke = live ? "#25d366" : "rgba(148,163,184,0.45)";
  const changePositive = Number(rate.oneWeekChangeBps) > 0;
  const changeNegative = Number(rate.oneWeekChangeBps) < 0;

  return (
    <article className={`group relative min-h-[216px] overflow-hidden rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.38)] ${live ? "border-white/10 bg-[#07110f]/95 hover:border-emerald-300/35" : "border-white/10 bg-slate-950/55 hover:border-amber-300/25"}`}>
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{rate.region}</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-white">{rate.name}</h3>
        </div>
        <StatusBadge status={statusForBadge(rate.status)} label={rate.statusLabel ?? (live ? "Live" : "Fallback")} className="scale-75 origin-top-right" />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className={live ? "text-3xl font-semibold tracking-[-0.04em] text-white" : "text-xl font-semibold text-slate-400"}>{valueLabel}</p>
          <p className="mt-1 text-[11px] text-slate-500">{rate.methodLabel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-right">
          <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">1W</p>
          <p className={`mt-1 text-[11px] font-semibold ${changePositive ? "text-emerald-300" : changeNegative ? "text-red-300" : "text-slate-300"}`}>{rate.oneWeekChangeLabel ?? "1W: N/A"}</p>
        </div>
      </div>

      <svg className="sparkline mt-4 h-10 w-full" viewBox="0 0 96 48" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 42 L96 42" stroke="rgba(148,163,184,0.1)" />
        <polyline points={pointsFor(rate.sparkline, inactive)} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
          <p className="flex items-center gap-1.5 uppercase tracking-[0.14em] text-slate-600"><Database className="h-3 w-3" /> Fuente</p>
          <p className="mt-1 truncate font-semibold text-slate-300">{rate.source}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
          <p className="flex items-center gap-1.5 uppercase tracking-[0.14em] text-slate-600"><Clock3 className="h-3 w-3" /> Fecha</p>
          <p className="mt-1 truncate font-semibold text-slate-300">{rate.date}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-2">
          <p className="uppercase tracking-[0.14em] text-slate-600">Estado</p>
          <p className="mt-1 truncate font-semibold text-slate-300">{rate.updateFrequency}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex translate-y-4 flex-col justify-end bg-gradient-to-t from-[#03100c] via-[#03100c]/95 to-transparent p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300"><Info className="h-3.5 w-3.5" /> Methodology</p>
        <p className="mt-2 text-[11px] leading-5 text-slate-300">{rate.methodology}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><span className="text-slate-500">Raw:</span> <span className="text-white">{rate.rawValue ?? "n/a"}</span></div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><span className="text-slate-500">1W:</span> <span className="text-white">{rate.oneWeekChangeLabel ?? "1W: N/A"}</span></div>
        </div>
        {rate.error && <p className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-200"><Minus className="h-3 w-3" /> {rate.error}</p>}
      </div>
    </article>
  );
}
