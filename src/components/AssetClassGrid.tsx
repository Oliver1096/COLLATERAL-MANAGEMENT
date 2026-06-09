import { ArrowRight } from "lucide-react";
import { assetClassItems } from "../data/navigation";

export function AssetClassGrid() {
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">Explorar por clase de activo</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
        {assetClassItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.title}
              href={item.href}
              className="group min-h-[74px] rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:-translate-y-0.5 hover:border-[#5d8871]/50 hover:bg-white/[0.055] hover:shadow-[0_14px_35px_rgba(0,0,0,0.22)]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#5d8871]/35 bg-[#17211c] text-[#b8c7be]">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <h3 className="mt-2 text-[11px] font-semibold text-white">{item.title}</h3>
              <p className="mt-0.5 line-clamp-1 text-[9px] text-slate-500">{item.description}</p>
            </a>
          );
        })}
      </div>
      <a href="/data-explorer" className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold text-emerald-300">
        Ver todas las clases de activo <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </section>
  );
}
