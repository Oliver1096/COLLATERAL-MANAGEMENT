import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Layers3, LineChart, ShieldCheck } from "lucide-react";
import { getEuroAreaDebtToGdp } from "../../services/eurostatService";
import { DataCompletionTable } from "./DataCompletionTable";
import { FixedIncomeCategorySection } from "./FixedIncomeCategorySection";
import { FixedIncomePulseCard } from "./FixedIncomePulseCard";

const loadingMetric = (id, label, source, unit) => ({ id, label, value: "--", unit, source, status: "loading" });
const missingMetric = (id, label, source, error, unit, status = "missing-data") => ({ id, label, value: "X", unit, source, status, error });

const formatRate = (metric, fallback = "Missing Data") => {
  if (!metric || metric.status !== "online") return fallback;
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`;
};

const metricById = (metrics, id) => metrics?.find((metric) => metric.id === id);

const card = ({
  title,
  category,
  mainMetric = "Missing Data",
  subMetric,
  source = "Provider needed",
  status = "missing-data",
  availability = "Provider needed",
  details,
  availableData = "None connected yet",
  missingData = "Production market data provider",
}) => ({ title, category, mainMetric, subMetric, source, status, availability, details, availableData, missingData });

const completionDescription = "Yield curve, rates history, spreads, maturity breakdown, instruments, analytics and watchlists.";

export function FixedIncomePage({ dashboardData }) {
  const [euroDebt, setEuroDebt] = useState(() => loadingMetric("EA20_DEBT_GDP", "Euro Area Debt/GDP", "Eurostat", "% GDP"));

  useEffect(() => {
    let mounted = true;
    getEuroAreaDebtToGdp().then((metric) => {
      if (mounted) setEuroDebt(metric);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fredMetrics = dashboardData?.fredMetrics ?? [];
  const metrics = dashboardData?.metrics ?? {};
  const tenYear = metricById(fredMetrics, "DGS10") ?? loadingMetric("DGS10", "US 10Y Yield", "FRED", "%");
  const twoYear = metricById(fredMetrics, "DGS2") ?? loadingMetric("DGS2", "US 2Y Yield", "FRED", "%");
  const spread = metricById(fredMetrics, "T10Y2Y") ?? loadingMetric("T10Y2Y", "10Y-2Y Spread", "FRED", "%");
  const fedFunds = metricById(fredMetrics, "FEDFUNDS") ?? loadingMetric("FEDFUNDS", "Fed Funds Rate", "FRED", "%");
  const sofr = metrics.sofr ?? loadingMetric("SOFR", "SOFR", "NY Fed", "%");
  const publicDebt = metrics.publicDebt ?? loadingMetric("US_DEBT", "US Public Debt", "U.S. Treasury");
  const ecbDeposit = missingMetric(
    "ECB_DEPOSIT",
    "ECB Deposit Rate",
    "ECB",
    "ECB deposit facility rate endpoint is not connected yet.",
    "%",
    "partial",
  );

  const pulse = [
    { metric: tenYear, change: tenYear.period, detail: "US Treasury constant maturity" },
    { metric: twoYear, change: twoYear.period, detail: "Front-end Treasury rate" },
    { metric: spread, change: spread.period, detail: "Curve slope signal" },
    { metric: fedFunds, change: fedFunds.period, detail: "Policy rate proxy" },
    { metric: sofr, change: sofr.period, detail: "Money market funding rate" },
    { metric: ecbDeposit, detail: "ECB policy rate placeholder" },
    { metric: publicDebt, change: publicDebt.period, detail: "Treasury fiscal data" },
    { metric: euroDebt, change: euroDebt.period, detail: "Eurostat fiscal ratio" },
  ];

  const categorySections = useMemo(() => {
    const treasuryLive = tenYear.status === "online" || twoYear.status === "online";
    const sofrLive = sofr.status === "online";
    const fedFundsLive = fedFunds.status === "online";
    const euroDebtLive = euroDebt.status === "online";

    return [
      {
        eyebrow: "Group A",
        title: "Government Bonds / Sovereign Debt",
        description: "Sovereign curves, fiscal signals, spread monitors and maturity maps.",
        cards: [
          card({
            title: "U.S. Treasuries",
            category: "Government Bonds",
            mainMetric: `10Y: ${formatRate(tenYear)}`,
            subMetric: `2Y: ${formatRate(twoYear)}`,
            source: "FRED",
            status: treasuryLive ? "online" : "missing-data",
            availability: treasuryLive ? "Rates live" : "Missing",
            details: "Yield curve, Treasury rates, spreads, maturity breakdown.",
            availableData: "DGS10, DGS2, T10Y2Y via FRED",
            missingData: "Intraday Treasury curve, auction detail, futures-implied analytics",
          }),
          card({
            title: "Euro Sovereign Debt",
            category: "Government Bonds",
            mainMetric: euroDebtLive ? `Debt/GDP: ${euroDebt.value}%` : "Partial Data",
            source: "Eurostat / ECB",
            status: euroDebtLive ? "partial" : "missing-data",
            availability: "Fiscal ratio connected",
            details: "Euro area debt ratios today; country yield curves later.",
            availableData: "Eurostat EA20 debt/GDP",
            missingData: "Country sovereign yields and spreads",
          }),
          card({ title: "Mexico Sovereign Debt", category: "Government Bonds", details: "Mbonos, Udibonos, CETES curve, auctions and Banxico signals.", source: "Banxico needed", missingData: "Mexico sovereign curve and auction data" }),
          card({ title: "UK Gilts", category: "Government Bonds", details: "Gilt yields, curve slope, linker market and BoE policy context.", source: "Market provider needed", missingData: "UK gilt curve" }),
          card({ title: "Japan Government Bonds", category: "Government Bonds", details: "JGB curve, BoJ operations, auction calendar and term-premium signals.", source: "Market provider needed", missingData: "JGB curve and BoJ operations feed" }),
          card({ title: "Emerging Market Sovereigns", category: "Government Bonds", details: "Hard/local currency sovereigns, spreads, CDS and external balance context.", source: "Bloomberg / Refinitiv", missingData: "EM sovereign prices, spreads and CDS" }),
        ],
      },
      {
        eyebrow: "Group B",
        title: "Rates & Money Markets",
        description: "Policy rates, secured funding, repo, money markets and global curve context.",
        cards: [
          card({ title: "SOFR", category: "Rates", mainMetric: formatRate(sofr), source: "NY Fed", status: sofrLive ? "online" : "missing-data", availability: sofrLive ? "Live" : "Missing", details: "SOFR fixings, secured funding trends and volatility.", availableData: "NY Fed SOFR", missingData: "SOFR futures and term structure" }),
          card({ title: "Effective Fed Funds Rate", category: "Rates", mainMetric: formatRate(fedFunds), source: "FRED", status: fedFundsLive ? "online" : "missing-data", availability: fedFundsLive ? "Live" : "Missing", details: "Policy-rate proxy and Federal Reserve monetary stance.", availableData: "FEDFUNDS via FRED", missingData: "Intraday expectations and OIS curve" }),
          card({ title: "Treasury Yield Curve", category: "Rates", mainMetric: `10Y-2Y: ${formatRate(spread)}`, source: "FRED", status: spread.status === "online" ? "online" : "partial", availability: "Curve partial", details: "US curve slope, inversions and maturity points.", availableData: "DGS10, DGS2, T10Y2Y", missingData: "Full maturity curve and intraday moves" }),
          card({ title: "ECB Rates", category: "Rates", mainMetric: "Partial Data", source: "ECB", status: "partial", availability: "Endpoint pending", details: "ECB deposit/refi rates and policy corridor.", availableData: "ECB source identified", missingData: "Deposit facility endpoint integration" }),
          card({ title: "Euro Area Yield Curve", category: "Rates", mainMetric: "Partial Data", source: "ECB / market provider", status: "partial", availability: "Provider needed", details: "Bund, OAT, BTP, Bonos and spread curves.", availableData: "Eurostat fiscal context", missingData: "Sovereign yield curves by country" }),
          card({ title: "Repo / Funding Markets", category: "Money Markets", mainMetric: "Partial Data", source: "NY Fed", status: "partial", availability: "Roadmap", details: "Repo rates, collateral rates, funding stress and operations.", availableData: "NY Fed source available", missingData: "Repo operations detail and collateral buckets" }),
        ],
      },
      {
        eyebrow: "Group C",
        title: "Credit Markets",
        description: "Corporate credit, spreads, yields, financial conditions and default risk.",
        cards: [
          card({ title: "Investment Grade Credit", category: "Credit", mainMetric: "Partial Data", source: "FRED ICE BofA / Bloomberg", status: "partial", availability: "Aggregate later", details: "IG spreads, yield, duration and sector breakdown.", availableData: "Potential FRED ICE BofA aggregate indexes", missingData: "Issuer-level prices and spreads" }),
          card({ title: "High Yield Credit", category: "Credit", mainMetric: "Partial Data", source: "FRED ICE BofA / Bloomberg", status: "partial", availability: "Aggregate later", details: "HY spreads, CCC stress, default expectations and sector heatmaps.", availableData: "Potential FRED ICE BofA aggregate indexes", missingData: "Issuer-level HY data" }),
          card({ title: "Credit Spreads", category: "Credit", mainMetric: "Partial Data", source: "FRED / Bloomberg", status: "partial", availability: "Partial", details: "OAS, spread curves and changes by rating bucket.", availableData: "Some aggregate spread series possible", missingData: "Full spread curves and sector detail" }),
          card({ title: "Corporate Bond Yields", category: "Credit", details: "Issuer, sector, rating and maturity yield matrix.", source: "Provider needed", missingData: "Corporate bond prices and yields" }),
          card({ title: "Financial Conditions", category: "Credit", mainMetric: "Partial Data", source: "FRED / Chicago Fed", status: "partial", availability: "Potential source", details: "Financial stress, liquidity and credit impulse indicators.", availableData: "FRED/Chicago Fed sources possible", missingData: "Full credit conditions model" }),
          card({ title: "Default Risk Monitor", category: "Credit", details: "Default rates, distress ratios, CDS and rating migration monitor.", source: "Ratings / Bloomberg", missingData: "Ratings, CDS and default datasets" }),
        ],
      },
      {
        eyebrow: "Group D",
        title: "Fixed Income Instruments",
        description: "Bills, notes, bonds, inflation-linked instruments and securitized credit.",
        cards: [
          card({ title: "Treasury Bills", category: "Instruments", mainMetric: "Partial Data", source: "U.S. Treasury", status: "partial", availability: "Auction data later", details: "Bill curve, auction results, roll-down and cash laddering.", availableData: "Treasury source connected", missingData: "Bill yields and auction calendar integration" }),
          card({ title: "Treasury Notes", category: "Instruments", mainMetric: `10Y: ${formatRate(tenYear)}`, source: "FRED", status: tenYear.status === "online" ? "online" : "partial", availability: "Rates live", details: "2Y-10Y note points, roll-down, duration and curve changes.", availableData: "FRED Treasury rates", missingData: "Instrument-level notes" }),
          card({ title: "Treasury Bonds", category: "Instruments", mainMetric: "Partial Data", source: "FRED / Treasury", status: "partial", availability: "Rates partial", details: "Long bonds, duration, convexity and curve risk.", availableData: "Selected Treasury rates", missingData: "20Y/30Y full integration and analytics" }),
          card({ title: "TIPS", category: "Instruments", mainMetric: "Missing Data", source: "FRED / Treasury", status: "missing-data", details: "Real yields, breakevens and inflation-linked performance.", availableData: "FRED source possible", missingData: "TIPS real yields and breakevens" }),
          card({ title: "Corporate Bonds", category: "Instruments", details: "Requires corporate bond data provider. Potential sources: ICE BofA via FRED, FMP commercial, Intrinio, Bloomberg, FactSet, Refinitiv.", source: "Provider needed", status: "partial", availability: "Provider needed", missingData: "CUSIP-level prices, yields and spreads" }),
          card({ title: "Municipal Bonds", category: "Instruments", details: "Muni curves, tax-equivalent yields, sectors and credit quality.", source: "MSRB / Bloomberg", missingData: "Muni prices and curves" }),
          card({ title: "MBS / ABS", category: "Instruments", details: "Mortgage and asset-backed spreads, prepayment risk and collateral pools.", source: "TRACE / Bloomberg", missingData: "Securitized product data" }),
        ],
      },
      {
        eyebrow: "Group E",
        title: "Fixed Income ETFs",
        description: "ETF universes, duration buckets, holdings, flows and performance attribution.",
        cards: [
          card({ title: "Short Duration ETFs", category: "ETFs", details: "Cash-plus and ultra-short ETF performance, yield and duration.", source: "ETF provider needed", missingData: "ETF holdings and flows" }),
          card({ title: "Treasury ETFs", category: "ETFs", details: "Treasury ETF exposure by maturity, duration and curve point.", source: "FMP / Bloomberg", missingData: "ETF prices, holdings and flows" }),
          card({ title: "Investment Grade ETFs", category: "ETFs", details: "IG ETF spreads, duration, sector weights and holdings quality.", source: "ETF provider needed", missingData: "ETF holdings and factor exposures" }),
          card({ title: "High Yield ETFs", category: "ETFs", details: "HY ETF liquidity, spread beta, flows and stress signals.", source: "ETF provider needed", missingData: "HY ETF holdings and flows" }),
          card({ title: "Inflation-Protected ETFs", category: "ETFs", details: "TIPS ETF real-yield sensitivity and breakeven exposure.", source: "ETF provider needed", missingData: "ETF holdings and real-yield analytics" }),
          card({ title: "Aggregate Bond ETFs", category: "ETFs", details: "Core aggregate duration, credit, mortgage and Treasury weights.", source: "ETF provider needed", missingData: "ETF holdings and attribution" }),
        ],
      },
    ];
  }, [tenYear, twoYear, spread, fedFunds, sofr, euroDebt]);

  return (
    <div className="space-y-3.5">
      <section className="premium-panel relative overflow-hidden rounded-[1.35rem] p-5 sm:p-6 lg:p-7">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Fixed Income Command Center
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Renta Fija</h1>
            <p className="mt-3 text-base font-medium text-slate-200">Rates, sovereign debt, credit markets and fixed-income intelligence.</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Explora tasas, curvas, bonos soberanos, crédito, money markets, ETFs e instrumentos de renta fija en una sola plataforma.
            </p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Connected sources: <span className="text-emerald-300">FRED · NY Fed · U.S. Treasury · ECB · Eurostat</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="grid grid-cols-3 gap-2">
              {["Cards View", "Table View", "Curve View"].map((view, index) => (
                <button
                  key={view}
                  className={`rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${index === 0 ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-slate-500"}`}
                >
                  {view}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><Activity className="mx-auto h-4 w-4 text-emerald-300" /><p className="mt-2 text-[10px] text-slate-400">Rates</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><LineChart className="mx-auto h-4 w-4 text-emerald-300" /><p className="mt-2 text-[10px] text-slate-400">Curves</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><Layers3 className="mx-auto h-4 w-4 text-emerald-300" /><p className="mt-2 text-[10px] text-slate-400">Credit</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-panel rounded-[1.25rem] p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <p className="section-title">Fixed Income Market Pulse</p>
            <p className="mt-1 text-[11px] text-slate-500">Live, partial and missing indicators for rates, sovereign debt and funding markets.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500"><BarChart3 className="h-3.5 w-3.5 text-emerald-300" /> Data refresh follows source availability</div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {pulse.map((item) => <FixedIncomePulseCard key={item.metric.id} metric={item.metric} change={item.change} detail={item.detail} />)}
        </div>
      </section>

      {categorySections.map((section) => <FixedIncomeCategorySection key={section.title} {...section} />)}
      <DataCompletionTable />
    </div>
  );
}
