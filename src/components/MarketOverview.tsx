import { StatusBadge } from "./StatusBadge";

const regions = [
  { label: "U.S.", x: "22%", y: "34%", move: "+0.6%" },
  { label: "Europe", x: "48%", y: "29%", move: "+0.2%" },
  { label: "Asia", x: "72%", y: "41%", move: "-0.1%" },
  { label: "LatAm", x: "33%", y: "68%", move: "+0.4%" },
];

export function MarketOverview() {
  return (
    <section className="glass-panel relative min-h-[360px] overflow-hidden rounded-[2rem] p-5">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Market Overview</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Mapa regional de rendimiento</h2>
          <p className="mt-1 text-sm text-slate-500">Placeholder visual hasta conectar proveedor global de indices.</p>
        </div>
        <StatusBadge status="mock" />
      </div>

      <div className="map-grid absolute inset-x-5 bottom-5 top-24 rounded-[1.6rem] border border-white/10 bg-black/25">
        <div className="absolute left-[14%] top-[20%] h-20 w-32 rounded-[45%] border border-emerald-300/20 bg-emerald-400/10 blur-[1px]" />
        <div className="absolute left-[43%] top-[19%] h-16 w-24 rounded-[45%] border border-emerald-300/20 bg-emerald-400/8 blur-[1px]" />
        <div className="absolute right-[12%] top-[30%] h-24 w-40 rounded-[45%] border border-white/15 bg-white/[0.05] blur-[1px]" />
        <div className="absolute left-[27%] bottom-[17%] h-24 w-20 rounded-[45%] border border-emerald-300/20 bg-emerald-400/8 blur-[1px]" />
        {regions.map((region) => (
          <div
            key={region.label}
            className="absolute rounded-2xl border border-white/10 bg-black/75 px-3 py-2 shadow-2xl"
            style={{ left: region.x, top: region.y }}
          >
            <p className="text-xs font-semibold text-white">{region.label}</p>
            <p className={region.move.startsWith("-") ? "text-xs text-red-300" : "text-xs text-emerald-300"}>
              {region.move}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
