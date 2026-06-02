import { FixedIncomeModuleCard } from "./FixedIncomeModuleCard";

export function FixedIncomeCategorySection({ title, eyebrow, description, cards }) {
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-title">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500">{description}</p>}
        </div>
        <a href="/data-explorer" className="text-[10px] font-semibold text-emerald-300">Explorar datos ›</a>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card) => <FixedIncomeModuleCard key={`${title}-${card.title}`} card={card} />)}
      </div>
    </section>
  );
}
