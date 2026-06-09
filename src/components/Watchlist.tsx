import { Apple, Plus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

const watchlist = [
  { ticker: "AAPL", name: "Apple Inc.", price: "193.42", move: "+0.58%", ytd: "+12.35%" },
  { ticker: "MSFT", name: "Microsoft Corp.", price: "415.12", move: "+0.41%", ytd: "+10.72%" },
  { ticker: "NVDA", name: "NVIDIA Corp.", price: "1,024.87", move: "+1.23%", ytd: "+47.16%" },
  { ticker: "AMZN", name: "Amazon.com, Inc.", price: "186.21", move: "-0.15%", ytd: "+8.21%" },
  { ticker: "GOOGL", name: "Alphabet Inc.", price: "165.88", move: "+0.34%", ytd: "+14.67%" },
];

export function Watchlist() {
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="section-title">Listas de seguimiento</p>
        <a href="/watchlists" className="text-[10px] font-semibold text-emerald-300">Ver todas</a>
      </div>
      <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2">
        <span className="text-[10px] text-slate-400">Mi Lista de Seguimiento</span>
        <StatusBadge status="mock" className="scale-75" />
      </div>
      <div className="grid grid-cols-[1.28fr_0.72fr_0.55fr_0.55fr] gap-2 border-b border-white/10 pb-2 text-[9px] uppercase tracking-[0.13em] text-slate-500">
        <span>Activo</span><span className="text-right">Precio</span><span className="text-right">Var. %</span><span className="text-right">YTD %</span>
      </div>
      <div className="divide-y divide-white/8">
        {watchlist.map((item) => (
          <div key={item.ticker} className="grid grid-cols-[1.28fr_0.72fr_0.55fr_0.55fr] items-center gap-2 py-2.5 text-[11px]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-slate-300"><Apple className="h-3 w-3" /></span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{item.ticker}</p>
                <p className="truncate text-[9px] text-slate-500">{item.name}</p>
              </div>
            </div>
            <p className="text-right text-slate-300">{item.price}</p>
            <p className={item.move.startsWith("-") ? "text-right text-red-300" : "text-right text-emerald-300"}>{item.move}</p>
            <p className={item.ytd.startsWith("-") ? "text-right text-red-300" : "text-right text-emerald-300"}>{item.ytd}</p>
          </div>
        ))}
      </div>
      <button className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-emerald-300">
        <Plus className="h-3.5 w-3.5" /> Agregar a lista
      </button>
    </section>
  );
}
