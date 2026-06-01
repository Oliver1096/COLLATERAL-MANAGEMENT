import { StatusBadge } from "./StatusBadge";

const regions = [
  { label: "U.S.", x: "15%", y: "39%", move: "+0.62%" },
  { label: "Europe", x: "45%", y: "31%", move: "+0.32%" },
  { label: "Asia", x: "73%", y: "42%", move: "-0.18%" },
  { label: "LatAm", x: "34%", y: "63%", move: "-0.35%" },
];

export function MarketOverview() {
  return (
    <section className="premium-panel relative min-h-[236px] overflow-hidden rounded-[1.25rem] p-4">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="section-title">Visión general del mercado</p>
          <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-400">
            <span className="border-b border-emerald-300 pb-1 text-emerald-300">Renta Variable</span>
            <span>Credit Markets</span>
            <span>FX</span>
            <span>Commodities</span>
            <span>Macro</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/mercados" className="text-[10px] font-semibold text-emerald-300">Ver más</a>
          <StatusBadge status="mock" className="scale-75" />
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4 top-[74px] overflow-hidden rounded-2xl border border-white/10 bg-black/32">
        <div className="map-grid absolute inset-0 opacity-55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_42%,rgba(37,211,102,0.2),transparent_20%),radial-gradient(circle_at_67%_42%,rgba(239,68,68,0.22),transparent_28%)]" />
        <div className="absolute left-[8%] top-[24%] h-14 w-32 rounded-[45%] bg-emerald-400/28 blur-sm" />
        <div className="absolute left-[41%] top-[20%] h-12 w-24 rounded-[45%] bg-emerald-400/22 blur-sm" />
        <div className="absolute right-[7%] top-[25%] h-18 w-44 rounded-[45%] bg-red-500/30 blur-sm" />
        <div className="absolute left-[23%] bottom-[13%] h-18 w-24 rounded-[45%] bg-red-500/25 blur-sm" />
        <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" />
        {regions.map((region) => (
          <div
            key={region.label}
            className="absolute rounded-lg border border-white/10 bg-black/72 px-3 py-2 backdrop-blur-md"
            style={{ left: region.x, top: region.y }}
          >
            <p className="text-[10px] font-semibold text-white">{region.label}</p>
            <p className={region.move.startsWith("-") ? "text-[10px] font-semibold text-red-300" : "text-[10px] font-semibold text-emerald-300"}>{region.move}</p>
          </div>
        ))}
        <div className="absolute bottom-3 right-5 flex items-center gap-2 text-[9px] text-slate-400">
          <span>-2.0%</span><span className="h-1.5 w-16 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400" /><span>+2.0%</span>
        </div>
      </div>
    </section>
  );
}
