import { StatusBadge } from "./StatusBadge";

const regions = [
  { label: "U.S.", x: "16%", y: "38%", move: "+0.62%" },
  { label: "Europe", x: "45%", y: "36%", move: "+0.35%" },
  { label: "Asia", x: "72%", y: "42%", move: "-0.21%" },
  { label: "LatAm", x: "33%", y: "68%", move: "-0.18%" },
];

export function MarketOverview() {
  return (
    <section className="relative min-h-[255px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#07100e]/95 p-4 shadow-panel">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Visión general del mercado</p>
          <div className="mt-3 flex gap-5 text-[11px] text-slate-400">
            <span className="border-b border-emerald-300 pb-1 text-emerald-300">Renta Variable</span>
            <span>Credit Markets</span>
            <span>FX</span>
            <span>Commodities</span>
            <span>Macro</span>
          </div>
        </div>
        <StatusBadge status="mock" className="scale-75" />
      </div>

      <div className="map-grid absolute inset-x-4 bottom-4 top-20 rounded-2xl border border-white/10 bg-black/30">
        <div className="absolute left-[8%] top-[24%] h-16 w-32 rounded-[45%] bg-emerald-400/28 blur-sm" />
        <div className="absolute left-[39%] top-[20%] h-14 w-24 rounded-[45%] bg-emerald-400/22 blur-sm" />
        <div className="absolute right-[8%] top-[26%] h-20 w-44 rounded-[45%] bg-red-500/30 blur-sm" />
        <div className="absolute left-[22%] bottom-[11%] h-20 w-24 rounded-[45%] bg-red-500/25 blur-sm" />
        {regions.map((region) => (
          <div
            key={region.label}
            className="absolute rounded-lg border border-white/10 bg-black/70 px-3 py-2 backdrop-blur"
            style={{ left: region.x, top: region.y }}
          >
            <p className="text-[11px] font-semibold text-white">{region.label}</p>
            <p className={region.move.startsWith("-") ? "text-[11px] text-red-300" : "text-[11px] text-emerald-300"}>{region.move}</p>
          </div>
        ))}
        <div className="absolute bottom-3 right-5 flex items-center gap-2 text-[10px] text-slate-400">
          <span>-2%</span><span className="h-2 w-14 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400" /><span>+2%</span>
        </div>
      </div>
    </section>
  );
}
