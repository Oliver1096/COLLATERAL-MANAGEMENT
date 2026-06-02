import { useEffect, useMemo, useState } from "react";
import { Activity, CircleDot, RefreshCw, ShieldCheck, Signal, TrendingUp } from "lucide-react";
import { loadFixedIncomeRates } from "../../services/fixedIncomeRates";
import { FixedIncomePulseCard } from "./FixedIncomePulseCard";

const emptyState = {
  interbank: [],
  treasuries: [],
  fetchedAt: null,
};

const loadingRate = (id, name, region, source) => ({
  id,
  name,
  region,
  source,
  status: "loading",
  statusLabel: "Loading",
  displayValue: "--",
  date: "Loading",
  methodLabel: "Loading latest official observation",
  updateFrequency: "Loading",
  methodology: "Fetching latest available rate from source API.",
  sparkline: [],
});

const loadingState = {
  interbank: [
    loadingRate("SOFR", "SOFR", "United States", "New York Fed"),
    loadingRate("TIIE_FONDEO_1D", "TIIE Fondeo 1D", "México", "Banxico"),
    loadingRate("ECBESTRVOLWGTTRMDMNRT", "€STR", "Euro Area", "ECB via FRED"),
    loadingRate("BRAZIL_CDI", "CDI", "Brazil", "Banco Central do Brasil"),
    loadingRate("BRAZIL_SELIC", "SELIC", "Brazil", "Banco Central do Brasil"),
    loadingRate("JAPAN_TONA", "Japan TONA", "Japan", "Bank of Japan"),
  ],
  treasuries: [
    loadingRate("DGS1MO", "1M Treasury", "United States", "FRED"),
    loadingRate("DGS3MO", "3M Treasury", "United States", "FRED"),
    loadingRate("DGS6MO", "6M Treasury", "United States", "FRED"),
    loadingRate("DGS1", "1Y Treasury", "United States", "FRED"),
  ],
  fetchedAt: null,
};

const formatRefresh = (value) => {
  if (!value) return "Loading";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
};

function SummaryTile({ label, value, icon: Icon, tone = "emerald" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/24 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <Icon className={tone === "emerald" ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-amber-200"} />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">{value}</p>
    </div>
  );
}

function SectionShell({ title, subtitle, children, aside }) {
  return (
    <section className="premium-panel rounded-[1.35rem] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-title">{title}</p>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">{subtitle}</p>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function TreasuryCurveStrip({ rates }) {
  const liveRates = rates.filter((rate) => rate.status === "online" && Number.isFinite(rate.value));
  const min = liveRates.length ? Math.min(...liveRates.map((rate) => rate.value)) : 0;
  const max = liveRates.length ? Math.max(...liveRates.map((rate) => rate.value)) : 1;
  const range = max - min || 1;

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-black/24 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mini term structure</p>
          <p className="mt-1 text-[11px] text-slate-400">Comparación visual de 1M, 3M, 6M y 1Y.</p>
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-300" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {rates.map((rate) => {
          const height = rate.status === "online" ? 28 + ((rate.value - min) / range) * 42 : 18;
          return (
            <div key={rate.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex h-20 items-end justify-center">
                <div className="w-8 rounded-t-lg bg-gradient-to-t from-emerald-500/40 to-emerald-300 shadow-[0_0_24px_rgba(37,211,102,0.18)]" style={{ height }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                <span className="font-semibold text-slate-300">{rate.name.replace(" Treasury", "")}</span>
                <span className="text-emerald-300">{rate.status === "online" ? `${rate.displayValue}%` : "X"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FixedIncomePage() {
  const [data, setData] = useState(loadingState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadFixedIncomeRates();
      setData(result);
    } catch (caughtError) {
      setData((current) => current ?? emptyState);
      setError(caughtError instanceof Error ? caughtError.message : "Unknown fixed-income loading error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const allRates = [...data.interbank, ...data.treasuries];
  const activeRates = allRates.filter((rate) => rate.status === "online").length;
  const connectedSources = new Set(allRates.filter((rate) => rate.status === "online").map((rate) => rate.source)).size;
  const sourceStatus = activeRates >= 7 ? "Operativo" : activeRates > 0 ? "Parcial" : "Sin conexión";
  const sourceTone = activeRates >= 7 ? "emerald" : "amber";

  const sectionCounts = useMemo(() => ({
    interbank: data.interbank.filter((rate) => rate.status === "online").length,
    treasuries: data.treasuries.filter((rate) => rate.status === "online").length,
  }), [data]);

  return (
    <div className="space-y-4">
      <section className="premium-panel relative overflow-hidden rounded-[1.35rem] p-5 sm:p-6 lg:p-7">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[1fr_0.95fr] xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Fixed Income Workspace
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Renta Fija</h1>
            <p className="mt-3 text-base font-medium text-slate-200">Interbancarios y U.S. Treasuries</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Tasas oficiales, money markets y tramo corto de Treasuries en una vista comparativa para trading, análisis y wealth management.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile label="Rates activos" value={`${activeRates}/10`} icon={Activity} />
            <SummaryTile label="Fuentes conectadas" value={connectedSources} icon={Signal} />
            <SummaryTile label="Última actualización" value={formatRefresh(data.fetchedAt)} icon={RefreshCw} />
            <SummaryTile label="Source status" value={sourceStatus} icon={CircleDot} tone={sourceTone} />
          </div>
        </div>
        <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/22 px-4 py-3">
          <p className="text-[11px] text-slate-400">
            APIs: <span className="text-emerald-300">New York Fed · Banxico · ECB via FRED · Banco Central do Brasil · Bank of Japan · FRED</span>
          </p>
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        {error && <p className="relative z-10 mt-3 text-[11px] text-amber-200">{error}</p>}
      </section>

      <SectionShell
        title="Interbancarios"
        subtitle="Overnight and interbank policy/funding rates across the U.S., México, Euro Area, Brazil and Japan. Brazil CDI/SELIC are normalized from daily values into annualized compounded rates."
        aside={<span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-200">{sectionCounts.interbank}/6 live</span>}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.interbank.map((rate) => <FixedIncomePulseCard key={rate.id} rate={rate} />)}
        </div>
      </SectionShell>

      <SectionShell
        title="U.S. Treasuries"
        subtitle="Latest available FRED constant maturity Treasury yields for the short end of the curve. Values are already annualized and displayed directly."
        aside={<span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-200">{sectionCounts.treasuries}/4 live</span>}
      >
        <TreasuryCurveStrip rates={data.treasuries} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.treasuries.map((rate) => <FixedIncomePulseCard key={rate.id} rate={rate} />)}
        </div>
      </SectionShell>
    </div>
  );
}
