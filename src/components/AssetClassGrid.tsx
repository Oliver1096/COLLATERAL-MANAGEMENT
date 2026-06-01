import { ArrowRight } from "lucide-react";
import { assetClassItems } from "../data/navigation";

export function AssetClassGrid() {
  return (
    <section className="rounded-[1.4rem] border border-white/10 bg-[#07100e]/95 p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Explorar por clase de activo</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
        {assetClassItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-emerald-300/30 hover:bg-emerald-400/10"
            >
              <Icon className="h-5 w-5 text-slate-300 transition group-hover:text-emerald-300" />
              <h3 className="mt-2 text-xs font-semibold text-white">{item.title}</h3>
              <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">{item.description}</p>
            </a>
          );
        })}
      </div>
      <a href="/data-explorer" className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-300">
        Ver todas las capacidades <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
