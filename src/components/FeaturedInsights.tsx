import { ArrowUpRight, Factory, Landmark, LineChart, Network } from "lucide-react";

const insights = [
  {
    title: "Rates Outlook",
    description: "Curva UST, Fed Funds, SOFR y senales de pendiente.",
    source: "FRED + NY Fed",
    icon: Landmark,
  },
  {
    title: "Energy Monitor",
    description: "WTI, inventarios, produccion y riesgo energetico.",
    source: "EIA",
    icon: Factory,
  },
  {
    title: "Global Macro",
    description: "Crecimiento, inflacion, deuda y balances externos.",
    source: "IMF + World Bank",
    icon: Network,
  },
  {
    title: "Credit Conditions",
    description: "Spreads agregados, liquidez y riesgos de credito.",
    source: "FRED / ECB / future credit API",
    icon: LineChart,
  },
];

export function FeaturedInsights() {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Featured Insights</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Inteligencia accionable</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <article key={insight.title} className="glass-panel group rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-600 transition group-hover:text-emerald-300" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{insight.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{insight.description}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-600">{insight.source}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
