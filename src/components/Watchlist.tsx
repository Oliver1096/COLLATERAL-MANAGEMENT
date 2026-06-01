import { StatusBadge } from "./StatusBadge";

const watchlist = [
  { ticker: "AAPL", name: "Apple Inc.", price: "194.20", move: "+0.8%" },
  { ticker: "MSFT", name: "Microsoft", price: "427.88", move: "+1.1%" },
  { ticker: "NVDA", name: "NVIDIA", price: "1,126.40", move: "+2.4%" },
  { ticker: "AMZN", name: "Amazon", price: "183.63", move: "-0.3%" },
  { ticker: "GOOGL", name: "Alphabet", price: "176.21", move: "+0.5%" },
];

export function Watchlist() {
  return (
    <section className="glass-panel rounded-[2rem] p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Watchlists</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Lista de seguimiento principal</h2>
          <p className="mt-1 text-sm text-slate-500">Datos mock hasta conectar proveedor de renta variable.</p>
        </div>
        <StatusBadge status="mock" />
      </div>
      <div className="space-y-3">
        {watchlist.map((item) => (
          <div key={item.ticker} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-3">
            <div>
              <p className="font-semibold text-white">{item.ticker}</p>
              <p className="text-xs text-slate-500">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">${item.price}</p>
              <p className={item.move.startsWith("-") ? "text-xs text-red-300" : "text-xs text-emerald-300"}>
                {item.move}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
