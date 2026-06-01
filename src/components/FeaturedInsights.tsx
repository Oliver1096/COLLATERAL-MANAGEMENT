import { ArrowRight, Building2, Factory, Landmark, Network } from "lucide-react";

const insights = [
  { title: "Rates Outlook", description: "SOFR, Fed & Global", source: "3 min de lectura", icon: Landmark },
  { title: "Energy Monitor", description: "Oil, Gas & Power", source: "2 min de lectura", icon: Factory },
  { title: "Global Macro", description: "Key Indicators", source: "4 min de lectura", icon: Network },
  { title: "Credit Conditions", description: "Spreads & Credit", source: "2 min de lectura", icon: Building2 },
];

export function FeaturedInsights() {
  return (
    <section className="rounded-[1.4rem] border border-white/10 bg-[#07100e]/95 p-4 shadow-panel">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Insights destacados</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <article key={insight.title} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-emerald-300/30">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-xs font-semibold text-white">{insight.title}</h3>
                <p className="mt-1 truncate text-[10px] text-slate-400">{insight.description}</p>
                <p className="mt-1 text-[10px] text-slate-500">{insight.source}</p>
              </div>
            </article>
          );
        })}
      </div>
      <a href="/insights" className="mt-4 flex justify-end text-emerald-300"><ArrowRight className="h-4 w-4" /></a>
    </section>
  );
}
