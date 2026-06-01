import { ArrowUpRight } from "lucide-react";
import { assetClassItems } from "../data/navigation";

export function AssetClassGrid() {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Explore by Asset Class</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Arquitectura lista para nuevas paginas</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assetClassItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.title}
              href={item.href}
              className="glass-panel group rounded-3xl p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-600 transition group-hover:text-emerald-300" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{item.description}</p>
              <p className="mt-4 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-slate-300">
                {item.status}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
