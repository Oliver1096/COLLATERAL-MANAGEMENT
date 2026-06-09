import { cachedJson } from "./http";
import type { MetricData, SourceHealth } from "../types/market";

interface NyFedRate {
  effectiveDate?: string;
  percentRate?: number | string;
  rate?: number | string;
}

interface NyFedResponse {
  refRates?: NyFedRate[];
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const getSofr = async (): Promise<MetricData> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 45);

  try {
    const url = `https://markets.newyorkfed.org/api/rates/secured/sofr/search.json?startDate=${isoDate(
      startDate,
    )}&endDate=${isoDate(endDate)}&type=rate`;
    const data = await cachedJson<NyFedResponse>("nyfed:sofr", url);
    const row = data.refRates?.[0];
    const numericValue = Number(row?.percentRate ?? row?.rate);

    if (!row || Number.isNaN(numericValue)) {
      return {
        id: "SOFR",
        label: "SOFR",
        value: "X",
        unit: "%",
        source: "NY Fed",
        status: "missing-data",
        error: "No recent SOFR rate returned by the New York Fed API.",
      };
    }

    return {
      id: "SOFR",
      label: "SOFR",
      value: numericValue.toFixed(2),
      rawValue: numericValue,
      unit: "%",
      period: row.effectiveDate,
      source: "NY Fed",
      status: "online",
    };
  } catch (error) {
    return {
      id: "SOFR",
      label: "SOFR",
      value: "X",
      unit: "%",
      source: "NY Fed",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown NY Fed error.",
    };
  }
};

export const getNyFedHealth = async (): Promise<SourceHealth> => {
  const metric = await getSofr();
  return {
    id: "ny-fed",
    name: "NY Fed",
    status: metric.status === "online" ? "online" : metric.status,
    description: "SOFR, EFFR, OBFR, repo and money-market operations.",
    lastUpdated: metric.period,
    error: metric.error,
  };
};
