import { getEcbHealth, getEurUsd } from "./ecbService";
import { getEiaHealth, getWtiCrude } from "./eiaService";
import { getEurostatHealth } from "./eurostatService";
import { getFredSeriesLatest } from "./fredService";
import { getGoldPrice } from "./goldApi";
import { getImfHealth } from "./imfService";
import { getNyFedHealth, getSofr } from "./nyFedService";
import { getPublicDebt, getTreasuryHealth } from "./treasuryService";
import { getWorldBankHealth } from "./worldBankService";
import type { DashboardData, LatestUpdate, MetricData, SourceHealth } from "../types/market";

const fredSeriesConfig = [
  { id: "SP500", label: "S&P 500" },
  { id: "DGS10", label: "US 10Y Yield", unit: "%" },
  { id: "DGS2", label: "US 2Y Yield", unit: "%" },
  { id: "T10Y2Y", label: "10Y-2Y Spread", unit: "%" },
  { id: "FEDFUNDS", label: "Federal Funds Rate", unit: "%" },
  { id: "SOFR", label: "SOFR", unit: "%" },
  { id: "CPIAUCSL", label: "US CPI Index" },
  { id: "CPILFESL", label: "Core CPI" },
  { id: "GDP", label: "US GDP", unit: "USD bn" },
  { id: "UNRATE", label: "US Unemployment", unit: "%" },
];

const missingMetric = (
  id: string,
  label: string,
  source: string,
  error: string,
  unit?: string,
): MetricData => ({
  id,
  label,
  value: "X",
  unit,
  source,
  status: "missing-data",
  error,
});

const delay = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const loadFredMetrics = async () => {
  const metrics: MetricData[] = [];

  for (const [index, series] of fredSeriesConfig.entries()) {
    if (index > 0) await delay(175);
    metrics.push(await getFredSeriesLatest(series.id, series.label, series.unit));
  }

  return metrics;
};

const bySeries = (metrics: MetricData[], id: string) => metrics.find((metric) => metric.id === id);

const fredHealthFromMetrics = (metrics: MetricData[]): SourceHealth => {
  const hasOnlineSeries = metrics.some((metric) => metric.status === "online");
  const firstProblem = metrics.find((metric) => metric.status !== "online");
  const latestOnline = metrics.find((metric) => metric.status === "online");

  return {
    id: "fred",
    name: "FRED",
    status: hasOnlineSeries ? "online" : firstProblem?.status ?? "error",
    description: "US macro, inflation, rates and selected market series.",
    lastUpdated: latestOnline?.period,
    error: hasOnlineSeries ? undefined : firstProblem?.error,
  };
};

export const loadDashboardData = async (): Promise<DashboardData> => {
  const fredMetrics = await loadFredMetrics();
  const tenYear = bySeries(fredMetrics, "DGS10") ?? missingMetric("DGS10", "US 10Y Yield", "FRED", "FRED did not return DGS10.", "%");
  const cpi = bySeries(fredMetrics, "CPIAUCSL") ?? missingMetric("CPIAUCSL", "US CPI Index", "FRED", "FRED did not return CPIAUCSL.");
  const sp500 = bySeries(fredMetrics, "SP500") ?? missingMetric("SP500", "S&P 500", "FRED", "FRED did not return SP500.");

  const [sofr, wti, eurUsd, publicDebt, gold, externalSources] = await Promise.all([
    getSofr(),
    getWtiCrude(),
    getEurUsd(),
    getPublicDebt(),
    getGoldPrice(),
    Promise.all([
      getNyFedHealth(),
      getTreasuryHealth(),
      getEcbHealth(),
      getEurostatHealth(),
      getImfHealth(),
      getWorldBankHealth(),
      getEiaHealth(),
    ]),
  ]);

  const sources = [fredHealthFromMetrics(fredMetrics), ...externalSources];

  const nasdaq = missingMetric(
    "NASDAQ100",
    "NASDAQ 100",
    "Missing equity index provider",
    "NASDAQ 100 is not available through the configured sources. Add an equity market data API.",
  );
  const bitcoin = missingMetric(
    "BTC",
    "Bitcoin",
    "Missing crypto provider",
    "No crypto exchange or pricing API is connected yet.",
    "USD",
  );

  const updates: LatestUpdate[] = [
    {
      id: "eia-wti",
      title: "EIA crude oil data",
      source: "EIA",
      value: wti.status === "online" ? `${wti.value} ${wti.unit ?? ""}`.trim() : "X",
      timestamp: wti.period,
      status: wti.status,
    },
    {
      id: "fred-cpi",
      title: "FRED CPI data",
      source: "FRED",
      value: cpi.status === "online" ? cpi.value : "X",
      timestamp: cpi.period,
      status: cpi.status,
    },
    {
      id: "fred-sp500",
      title: "FRED S&P 500 data",
      source: "FRED",
      value: sp500.status === "online" ? sp500.value : "X",
      timestamp: sp500.period,
      status: sp500.status,
    },
    {
      id: "imf-catalog",
      title: "IMF macro data",
      source: "IMF",
      value: sources.find((source) => source.id === "imf")?.status === "online" ? "Catalog online" : "X",
      timestamp: sources.find((source) => source.id === "imf")?.lastUpdated,
      status: sources.find((source) => source.id === "imf")?.status ?? "error",
    },
    {
      id: "nyfed-sofr",
      title: "NY Fed SOFR data",
      source: "NY Fed",
      value: sofr.status === "online" ? `${sofr.value}%` : "X",
      timestamp: sofr.period,
      status: sofr.status,
    },
    {
      id: "treasury-debt",
      title: "Treasury debt data",
      source: "U.S. Treasury",
      value: publicDebt.status === "online" ? publicDebt.value : "X",
      timestamp: publicDebt.period,
      status: publicDebt.status,
    },
  ];

  return {
    metrics: {
      tenYear,
      cpi,
      sp500,
      nasdaq,
      sofr,
      wti,
      gold,
      eurUsd,
      publicDebt,
      bitcoin,
    },
    fredMetrics,
    sources,
    updates,
    loading: false,
  };
};
