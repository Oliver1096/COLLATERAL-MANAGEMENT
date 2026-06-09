import { cachedJson } from "./http";
import type { MetricData, SourceHealth } from "../types/market";

interface DebtRow {
  record_date: string;
  tot_pub_debt_out_amt: string;
}

interface TreasuryResponse {
  data?: DebtRow[];
}

const compactCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
    style: "currency",
    currency: "USD",
  }).format(value);

export const getPublicDebt = async (): Promise<MetricData> => {
  try {
    const url =
      "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1";
    const data = await cachedJson<TreasuryResponse>("treasury:public-debt", url);
    const row = data.data?.[0];
    const numericValue = Number(row?.tot_pub_debt_out_amt);

    if (!row || Number.isNaN(numericValue)) {
      return {
        id: "US_DEBT",
        label: "US Public Debt",
        value: "X",
        source: "U.S. Treasury",
        status: "missing-data",
        error: "No public debt record returned by Fiscal Data.",
      };
    }

    return {
      id: "US_DEBT",
      label: "US Public Debt",
      value: compactCurrency(numericValue),
      rawValue: numericValue,
      period: row.record_date,
      source: "U.S. Treasury",
      status: "online",
    };
  } catch (error) {
    return {
      id: "US_DEBT",
      label: "US Public Debt",
      value: "X",
      source: "U.S. Treasury",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown Treasury error.",
    };
  }
};

export const getTreasuryHealth = async (): Promise<SourceHealth> => {
  const metric = await getPublicDebt();
  return {
    id: "treasury",
    name: "U.S. Treasury",
    status: metric.status === "online" ? "online" : metric.status,
    description: "US public debt, Treasury securities and fiscal data.",
    lastUpdated: metric.period,
    error: metric.error,
  };
};
