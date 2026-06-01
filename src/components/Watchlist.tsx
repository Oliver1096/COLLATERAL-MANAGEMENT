import { Apple, Plus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

const watchlist = [
  { ticker: "AAPL", name: "Apple Inc.", price: "195.61", move: "+0.45%", ytd: "+8.21%" },
  { ticker: "MSFT", name: "Microsoft Corp.", price: "415.37", move: "+0.32%", ytd: "+6.11%" },
  { ticker: "NVDA", name: "NVIDIA Corp.", price: "1,224.40", move: "+1.35%", ytd: "+17.43%" },
  { ticker: "AMZN", name: "Amazon.com, Inc.", price: "187.20", move: "-0.12%", ytd: "-2.18%" },
  { ticker: "GOOGL", name: "Alphabet Inc.", price: "167.57", move: "+0.28%", ytd: "+1.87%" },
];

export function Watchlist() {
  return (
    <section className="rounded-[1.4rem] border border-white/10 bg-[#07100e]/95 p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Listas de seguimiento</p>
        <a href="/watchlists" className="text-[11px] text-emerald-300">Ver todo</a>
      </div>
      <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2">
        <span className="text-[11px] text-slate-400">Mi Lista de Seguimiento</span>
        <StatusBadge status="mock" className="scale-75" />
      </div>
      <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr] gap-2 border-b border-white/10 pb-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
        <span>Activo</span><span>Precio</span><span>1D %</span><span>YTD %</span>
      </div>
      <div className="divide-y divide-white/10">
        {watchlist.map((item) => (
          <div key={item.ticker} className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.6fr] items-center gap-2 py-2 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/[0.06] text-slate-300"><Apple className="h-3 w-3" /></span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{item.ticker}</p>
                <p className="truncate text-[10px] text-slate-500">{item.name}</p>
              </div>
            </div>
            <p className="text-slate-300">{item.price}</p>
            <p className={item.move.startsWith("-") ? "text-red-300" : "text-emerald-300"}>{item.move}</p>
            <p className={item.ytd.startsWith("-") ? "text-red-300" : "text-emerald-300"}>{item.ytd}</p>
          </div>
        ))}
      </div>
      <button className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-300">
        <Plus className="h-3.5 w-3.5" /> Agregar a lista
      </button>
    </section>
  );
}
