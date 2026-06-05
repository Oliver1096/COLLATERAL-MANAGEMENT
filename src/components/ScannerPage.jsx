import { useMemo, useState } from "react";
import { AlertTriangle, Database, Download, ExternalLink, Loader2, Search } from "lucide-react";

const money = (value) =>
  typeof value === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
    : "—";
const number = (value) => (typeof value === "number" ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value) : "—");
const pct = (value) => (typeof value === "number" ? `${value.toFixed(4)}%` : "—");

function InfoRow({ label, value, href }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 truncate text-[11px] font-semibold text-emerald-300">
          XML source <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="mt-1 truncate text-[11px] font-semibold text-slate-200">{value || "—"}</p>
      )}
    </div>
  );
}


function ResolvedInstrumentCard({ instrument }) {
  if (!instrument) return null;
  const rows = [
    ["Original input", instrument.input],
    ["Resolved ticker", instrument.resolved_ticker || instrument.ticker],
    ["Instrument name", instrument.name],
    ["FIGI", instrument.figi],
    ["Composite FIGI", instrument.composite_figi],
    ["Share Class FIGI", instrument.share_class_figi],
    ["Exchange", instrument.exchange],
    ["Security type", instrument.security_type2 || instrument.security_type],
    ["Resolution", instrument.resolution_source],
  ];
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="section-title">Resolved Instrument</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">{instrument.name || instrument.resolved_ticker}</h2>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">OpenFIGI</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
      </div>
    </section>
  );
}

function CandidateSelection({ candidates, onSelect }) {
  if (!candidates?.length) return null;
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <p className="section-title">Candidate selection</p>
      <h2 className="mt-1 text-lg font-semibold text-white">Selecciona el instrumento correcto</h2>
      <p className="mt-1 text-[12px] text-slate-500">OpenFIGI devolvió múltiples coincidencias posibles.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {candidates.map((candidate) => (
          <button key={`${candidate.ticker}-${candidate.figi}-${candidate.exchange}`} onClick={() => onSelect(candidate)} className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300/35 hover:bg-emerald-400/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{candidate.ticker}</p>
                <p className="mt-1 line-clamp-2 text-[12px] text-slate-400">{candidate.name}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/24 px-2 py-1 text-[9px] font-semibold text-slate-300">{candidate.exchange || "—"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
              <span>{candidate.security_type2 || candidate.security_type || "—"}</span>
              <span className="truncate text-right">{candidate.figi || "—"}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({ data }) {
  const fund = data.fund;
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="section-title">Fund summary</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">{fund.name || fund.series_name || data.ticker}</h2>
          <p className="mt-1 text-[12px] text-slate-500">Input ticker: <span className="text-emerald-300">{data.ticker}</span></p>
        </div>
        <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">SEC NPORT-P</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <InfoRow label="Registrant" value={fund.registrant_name} />
        <InfoRow label="CIK" value={fund.cik} />
        <InfoRow label="Series ID" value={fund.series_id} />
        <InfoRow label="Class ID" value={fund.class_id} />
        <InfoRow label="Accession" value={fund.accession} />
        <InfoRow label="Filing date" value={fund.filing_date} />
        <InfoRow label="Report period" value={fund.report_period} />
        <InfoRow label="XML" href={fund.xml_url} />
      </div>
    </section>
  );
}

function QualityCard({ data }) {
  const q = data.quality_check;
  const tiles = [
    ["Holdings", number(q.holdings_count)],
    ["Total weight", pct(q.total_weight_pct)],
    ["Market value", money(q.total_market_value_usd)],
    ["Top holding", q.top_holding || "—"],
    ["Net assets", money(q.net_assets)],
    ["Total assets", money(q.total_assets)],
    ["Total liabilities", money(q.total_liabilities)],
  ];
  return (
    <section className="premium-panel rounded-[1.25rem] p-4">
      <p className="section-title">Quality check</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-black/24 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HoldingsTable({ holdings, ticker = "holdings" }) {
  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return holdings;
    return holdings.filter((h) => [h.name, h.isin, h.cusip, h.asset_category, h.issuer_category, h.country].some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [holdings, filter]);

  const downloadCsv = () => {
    const cols = ["name","isin","cusip","market_value_usd","weight_pct","asset_category","issuer_category","country","currency","balance","units"];
    const body = [cols.join(","), ...holdings.map((h) => cols.map((c) => `"${String(h[c] ?? "").replaceAll('"','""')}"`).join(","))].join("\n");
    const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTicker = String(ticker || "holdings").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    link.href = url;
    link.download = `nsc-insights-${safeTicker}-holdings.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="premium-panel overflow-hidden rounded-[1.25rem]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <p className="section-title">Holdings</p>
          <p className="mt-1 text-[11px] text-slate-500">All SEC &lt;invstOrSec&gt; holdings, sorted by weight descending.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar holdings..." className="h-9 rounded-xl border border-white/10 bg-black/28 px-3 text-[12px] text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/40" />
          <button onClick={downloadCsv} className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[11px] font-semibold text-slate-300 hover:border-emerald-300/30 hover:text-emerald-200"><Download className="h-3.5 w-3.5" /> Download CSV</button>
        </div>
      </div>
      <div className="max-h-[620px] overflow-auto">
        <table className="min-w-[1180px] w-full border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10 bg-[#07100e] text-[9px] uppercase tracking-[0.16em] text-slate-500">
            <tr>{["Name","ISIN","CUSIP","Market Value USD","Weight %","Asset Category","Issuer Category","Country","Currency","Balance","Units"].map((h) => <th key={h} className="border-b border-white/10 px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((h, index) => (
              <tr key={`${h.cusip}-${h.isin}-${index}`} className="border-b border-white/8 transition hover:bg-white/[0.025]">
                <td className="max-w-[280px] px-4 py-3 font-semibold text-white"><span className="line-clamp-1">{h.name}</span></td>
                <td className="px-4 py-3 text-slate-400">{h.isin || "—"}</td>
                <td className="px-4 py-3 text-slate-400">{h.cusip || "—"}</td>
                <td className="px-4 py-3 text-slate-300">{money(h.market_value_usd)}</td>
                <td className="px-4 py-3 text-emerald-300">{pct(h.weight_pct)}</td>
                <td className="px-4 py-3 text-slate-400">{h.asset_category || "—"}</td>
                <td className="px-4 py-3 text-slate-400">{h.issuer_category || "—"}</td>
                <td className="px-4 py-3 text-slate-400">{h.country || "—"}</td>
                <td className="px-4 py-3 text-slate-400">{h.currency || "—"}</td>
                <td className="px-4 py-3 text-slate-400">{number(h.balance)}</td>
                <td className="px-4 py-3 text-slate-400">{h.units || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ScannerPage() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const submit = async (event) => {
    event.preventDefault();
    const normalized = ticker.trim().toUpperCase();
    if (!normalized) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCandidates([]);
    try {
      const response = await fetch(`/api/scanner/sec-holdings?query=${encodeURIComponent(normalized)}`);
      const data = await response.json();
      if (data.needs_selection) {
        setCandidates(data.candidates ?? []);
        return;
      }
      if (!response.ok || !data.success) throw new Error(data.error || "SEC scanner failed.");
      setResult(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown scanner error.");
    } finally {
      setLoading(false);
    }
  };

  const selectCandidate = async (candidate) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`/api/scanner/sec-holdings?ticker=${encodeURIComponent(candidate.ticker)}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "SEC scanner failed.");
      setCandidates([]);
      setResult({ ...data, resolved_instrument: { ...candidate, input: ticker, resolved_ticker: candidate.ticker, resolution_source: "OpenFIGI candidate selection" } });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown scanner error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="premium-panel rounded-[1.35rem] p-6 sm:p-8">
        <p className="section-title">Snapshot</p>
        <h1 className="mt-3 text-4xl font-semibold uppercase tracking-[-0.05em] text-white sm:text-5xl">Instrument Scanner</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">Busca por ticker, ISIN, CUSIP o nombre de fondo/ETF de Estados Unidos.</p>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
          <label className="text-sm font-semibold text-white">Busca por ticker, ISIN, CUSIP o nombre</label>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input value={ticker} onChange={(event) => setTicker(event.target.value.toUpperCase())} placeholder="Ej. IVV · US4642872000 · 464287200 · iShares Core S&P 500 ETF" className="h-12 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/45" />
            <button disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-black uppercase tracking-[0.14em] text-black transition hover:bg-emerald-200 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
            </button>
          </div>
        </form>
        {error && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100"><AlertTriangle className="mt-0.5 h-4 w-4" />{error}</div>}
      </section>

      {loading && <section className="premium-panel rounded-[1.25rem] p-6 text-sm text-slate-300"><Loader2 className="mr-2 inline h-4 w-4 animate-spin text-emerald-300" />Resolviendo instrumento y consultando SEC NPORT-P filings...</section>}
      <CandidateSelection candidates={candidates} onSelect={selectCandidate} />
      {result && (
        <>
          <ResolvedInstrumentCard instrument={result.resolved_instrument} />
          <SummaryCard data={result} />
          <QualityCard data={result} />
          <HoldingsTable holdings={result.holdings} ticker={result.ticker} />
        </>
      )}
    </div>
  );
}
