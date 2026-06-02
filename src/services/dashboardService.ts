import { getEcbHealth, getEurUsd } from "./ecbService";
import { getEiaHealth, getWtiCrude } from "./eiaService";
import { getEurostatHealth } from "./eurostatService";
import { getFredHealth, getFredSeriesLatest } from "./fredService";
import { getGoldPrice } from "./goldApi";
import { getImfHealth } from "./imfService";
import { getNyFedHealth, getSofr } from "./nyFedService";
import { getPublicDebt, getTreasuryHealth } from "./treasuryService";
import { getWorldBankHealth } from "./worldBankService";
import type { DashboardData, LatestUpdate, MetricData } from "../types/market";

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

export const loadDashboardData = async (): Promise<DashboardData> => {
  const [tenYear, cpi, sp500, sofr, wti, eurUsd, publicDebt, gold, sources] = await Promise.all([
    getFredSeriesLatest("DGS10", "US 10Y Yield", "%"),
    getFredSeriesLatest("CPIAUCSL", "US CPI Index"),
    getFredSeriesLatest("SP500", "S&P 500"),
    getSofr(),
    getWtiCrude(),
    getEurUsd(),
    getPublicDebt(),
    getGoldPrice(),
    Promise.all([
      getFredHealth(),
      getNyFedHealth(),
      getTreasuryHealth(),
      getEcbHealth(),
      getEurostatHealth(),
      getImfHealth(),
      getWorldBankHealth(),
      getEiaHealth(),
    ]),
  ]);

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
    sources,
    updates,
    loading: false,
  };
};
