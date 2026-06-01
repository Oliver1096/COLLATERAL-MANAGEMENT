import { apiConfig, hasApiKey } from "./config";
import { buildQuery, cachedJson } from "./http";
import type { MetricData, SourceHealth } from "../types/market";

interface FredObservation {
  date: string;
  value: string;
}

interface FredSeriesResponse {
  observations?: FredObservation[];
  error_message?: string;
}

const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations";

const formatNumber = (value: number, decimals = 2) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);

export const getFredSeriesLatest = async (
  seriesId: string,
  label: string,
  unit?: string,
): Promise<MetricData> => {
  if (!hasApiKey(apiConfig.fredApiKey)) {
    return {
      id: seriesId,
      label,
      value: "X",
      unit,
      source: "FRED",
      status: "missing-key",
      error: "VITE_FRED_API_KEY is not configured.",
    };
  }

  try {
    const query = buildQuery({
      series_id: seriesId,
      api_key: apiConfig.fredApiKey,
      file_type: "json",
      sort_order: "desc",
      limit: 8,
    });
    const data = await cachedJson<FredSeriesResponse>(`fred:${seriesId}`, `${FRED_BASE_URL}?${query}`);

    if (data.error_message) throw new Error(data.error_message);

    const observation = data.observations?.find((item) => item.value !== ".");
    const numericValue = observation ? Number(observation.value) : Number.NaN;

    if (!observation || Number.isNaN(numericValue)) {
      return {
        id: seriesId,
        label,
        value: "X",
        unit,
        source: "FRED",
        status: "missing-data",
        error: `No recent observation returned for ${seriesId}.`,
      };
    }

    return {
      id: seriesId,
      label,
      value: formatNumber(numericValue, Math.abs(numericValue) >= 1000 ? 0 : 2),
      rawValue: numericValue,
      unit,
      period: observation.date,
      source: "FRED",
      status: "online",
    };
  } catch (error) {
    return {
      id: seriesId,
      label,
      value: "X",
      unit,
      source: "FRED",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown FRED error.",
    };
  }
};

export const getFredHealth = async (): Promise<SourceHealth> => {
  const metric = await getFredSeriesLatest("DGS10", "US 10Y Yield", "%");
  return {
    id: "fred",
    name: "FRED",
    status: metric.status === "online" ? "online" : metric.status,
    description: "US macro, inflation, rates and selected market series.",
    lastUpdated: metric.period,
    error: metric.error,
  };
};
