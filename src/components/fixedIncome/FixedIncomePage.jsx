import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

const emptyData = {
  sources_connected: [],
  mexico: { banxico_cards: [], mbonos: [], udibonos: [], bei: [], cetes: [] },
  usa: { fed_cards: [], ust: [], tips: [], bei: [], spreads: [], commodities: [], fx: [] },
};

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";

function Section({ title, subtitle, children }) {
  return (
    <section className="premium-panel rounded-[1.25rem] p-4 sm:p-5">
      <div className="mb-4 border-b border-emerald-300/15 pb-3">
        <p className="text-2xl font-semibold tracking-[-0.035em] text-white">{title}</p>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SimpleCard({ item }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/24 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.name}</p>
      <p className={item.value === "X" ? "mt-3 text-3xl font-semibold text-slate-500" : "mt-3 text-3xl font-semibold tracking-[-0.035em] text-white"}>{item.value ?? "X"}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-500">
        <span>{item.source ?? "Pending"}</span>
        <span>{item.date ?? "—"}</span>
      </div>
    </article>
  );
}

function CardsGrid({ items }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{items.map((item) => <SimpleCard key={item.name} item={item} />)}</div>;
}

function DataTable({ title, columns, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <div className="border-b border-white/10 bg-emerald-400/[0.055] px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#07110f] text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`} className="border-t border-white/10 transition hover:bg-white/[0.025]">
                {columns.map((column) => {
                  const value = row[column.key] ?? "X";
                  const change = column.key === "change" || column.key === "variation" || column.key === "one_week_change";
                  const positive = change && typeof value === "string" && value.startsWith("+");
                  const negative = change && typeof value === "string" && value.startsWith("-");
                  return (
                    <td key={column.key} className={`px-4 py-3 ${value === "X" ? "text-slate-600" : positive ? "text-emerald-300" : negative ? "text-red-300" : "text-slate-200"}`}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const yieldColumns = [
  { key: "instrument", label: "Instrumento" },
  { key: "tenor", label: "Plazo" },
  { key: "yield", label: "Yield" },
  { key: "change", label: "Cambio" },
];
const cetesColumns = [
  { key: "title", label: "Título" },
  { key: "days", label: "Plazo días" },
  { key: "rate", label: "Tasa Actual" },
  { key: "variation", label: "Variación" },
];

export function FixedIncomePage() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/fixed-income/overview");
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "No se pudo cargar Renta Fija.");
      setData(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const sourcesCount = data.sources_connected?.length ?? 0;
  const lastUpdated = data.last_updated;
  const mexico = data.mexico ?? emptyData.mexico;
  const usa = data.usa ?? emptyData.usa;
  const spreadColumns = [{ key: "spread", label: "Spread" }, { key: "bps", label: "BPS" }];
  const commodityColumns = [{ key: "commodity", label: "Commodity" }, { key: "price", label: "Price" }, { key: "one_week_change", label: "1 week Chg %" }];
  const fxColumns = [{ key: "fx", label: "FX" }, { key: "value", label: "Value" }];

  return (
    <div className="space-y-4">
      <section className="premium-panel rounded-[1.35rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Renta Fija</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Indicadores actualizados de renta fija, tasas, curvas, spreads, commodities y FX.</p>
          </div>
          <button onClick={refresh} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#5d8871]/35 bg-[#17211c] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b8c7be] transition hover:bg-emerald-400/15 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/24 p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Última actualización</p><p className="mt-2 text-sm font-semibold text-white">{formatDateTime(lastUpdated)}</p></div>
          <div className="rounded-xl border border-white/10 bg-black/24 p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Fuentes conectadas</p><p className="mt-2 text-sm font-semibold text-white">{sourcesCount}</p></div>
          <div className="rounded-xl border border-white/10 bg-black/24 p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Estado</p><p className="mt-2 text-sm font-semibold text-emerald-300">{loading ? "Actualizando" : "Operativo"}</p></div>
        </div>
        {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      </section>

      <Section title="México" subtitle="Indicadores de Renta Fija en México">
        <div className="space-y-4">
          <CardsGrid items={mexico.banxico_cards ?? []} />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataTable title="BONOS / MBONOS" columns={yieldColumns} rows={mexico.mbonos ?? []} />
            <DataTable title="UDIBONOS" columns={yieldColumns} rows={mexico.udibonos ?? []} />
            <DataTable title="BEI México" columns={yieldColumns} rows={mexico.bei ?? []} />
          </div>
          <DataTable title="CETES" columns={cetesColumns} rows={mexico.cetes ?? []} />
        </div>
      </Section>

      <Section title="USA" subtitle="Indicadores de Renta Fija en Estados Unidos">
        <div className="space-y-4">
          <CardsGrid items={usa.fed_cards ?? []} />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataTable title="UST" columns={yieldColumns} rows={usa.ust ?? []} />
            <DataTable title="TIPS" columns={yieldColumns} rows={usa.tips ?? []} />
            <DataTable title="BEI USA" columns={yieldColumns} rows={usa.bei ?? []} />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <DataTable title="Spreads" columns={spreadColumns} rows={usa.spreads ?? []} />
            <DataTable title="Commodities" columns={commodityColumns} rows={usa.commodities ?? []} />
            <DataTable title="FX" columns={fxColumns} rows={usa.fx ?? []} />
          </div>
        </div>
      </Section>
    </div>
  );
}
