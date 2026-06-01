import { apiConfig, hasApiKey } from "./config";
import { cachedJson } from "./http";
import type { MetricData, SourceHealth } from "../types/market";

interface EiaRow {
  period: string;
  value: number | string;
  units?: string;
}

interface EiaResponse {
  response?: {
    data?: EiaRow[];
  };
  error?: string;
}

const WTI_URL =
  "https://api.eia.gov/v2/petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=10";

export const getWtiCrude = async (): Promise<MetricData> => {
  if (!hasApiKey(apiConfig.eiaApiKey)) {
    return {
      id: "WTI",
      label: "WTI Crude",
      value: "X",
      unit: "USD/bbl",
      source: "EIA",
      status: "missing-key",
      error: "VITE_EIA_API_KEY is not configured.",
    };
  }

  try {
    const data = await cachedJson<EiaResponse>("eia:wti", `${WTI_URL}&api_key=${apiConfig.eiaApiKey}`);
    if (data.error) throw new Error(data.error);

    const row = data.response?.data?.find((item) => item.value !== null && item.value !== undefined);
    const numericValue = row ? Number(row.value) : Number.NaN;

    if (!row || Number.isNaN(numericValue)) {
      return {
        id: "WTI",
        label: "WTI Crude",
        value: "X",
        unit: "USD/bbl",
        source: "EIA",
        status: "missing-data",
        error: "No WTI observations were returned by EIA.",
      };
    }

    return {
      id: "WTI",
      label: "WTI Crude",
      value: numericValue.toFixed(2),
      rawValue: numericValue,
      unit: row.units ?? "USD/bbl",
      period: row.period,
      source: "EIA",
      status: "online",
    };
  } catch (error) {
    return {
      id: "WTI",
      label: "WTI Crude",
      value: "X",
      unit: "USD/bbl",
      source: "EIA",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown EIA error.",
    };
  }
};

export const getEiaHealth = async (): Promise<SourceHealth> => {
  const metric = await getWtiCrude();
  return {
    id: "eia",
    name: "EIA",
    status: metric.status === "online" ? "online" : metric.status,
    description: "Energy, petroleum, natural gas, electricity and inventories.",
    lastUpdated: metric.period,
    error: metric.error,
  };
};
