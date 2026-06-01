import { ArrowRight, Building2, Factory, Landmark, Network } from "lucide-react";

const insights = [
  { title: "Flujos Institucionales", description: "Entradas netas a renta variable global por USD 12.4B esta semana.", source: "Hace 2 horas", tag: "Mercados", icon: Landmark },
  { title: "Cambio de Régimen", description: "Caen expectativas de recortes de tasas en EE. UU. para Q3 2024.", source: "Hace 4 horas", tag: "Economía", icon: Factory },
  { title: "Alerta de Volatilidad", description: "Aumento de volatilidad en tecnología. Vigilar niveles de soporte clave.", source: "Hace 6 horas", tag: "Riesgo", icon: Network },
  { title: "Oportunidad de Valor", description: "Sectores defensivos con valoraciones atractivas frente a promedios históricos.", source: "Hace 8 horas", tag: "Empresas", icon: Building2 },
];

export function FeaturedInsights() {
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">Insights destacados</p>
        <a href="/insights" className="text-[10px] font-semibold text-emerald-300">Ver todos los insights ›</a>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <article key={insight.title} className="group min-h-[118px] rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-emerald-300/30 hover:bg-white/[0.055]">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">{insight.tag}</span>
                <Icon className="h-4 w-4 text-slate-500 group-hover:text-emerald-300" />
              </div>
              <h3 className="text-[12px] font-semibold text-white">{insight.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-400">{insight.description}</p>
              <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
                <span>{insight.source}</span>
                <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-emerald-300" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
