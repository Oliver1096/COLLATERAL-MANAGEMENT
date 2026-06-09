import { cachedJson } from "./http";
import type { MetricData, SourceHealth } from "../types/market";

interface EcbObservationValue {
  id?: string;
  name?: string;
}

interface EcbJsonDataResponse {
  dataSets?: Array<{
    series?: Record<string, { observations?: Record<string, [number]> }>;
  }>;
  structure?: {
    dimensions?: {
      observation?: Array<{
        values?: EcbObservationValue[];
      }>;
    };
  };
}

export const getEurUsd = async (): Promise<MetricData> => {
  try {
    const url = "https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?format=jsondata";
    const data = await cachedJson<EcbJsonDataResponse>("ecb:eur-usd", url);
    const series = data.dataSets?.[0]?.series;
    const firstSeries = series ? Object.values(series)[0] : undefined;
    const observations = firstSeries?.observations ?? {};
    const keys = Object.keys(observations).sort((a, b) => Number(a) - Number(b));
    const latestKey = keys.at(-1);
    const numericValue = latestKey ? observations[latestKey]?.[0] : Number.NaN;
    const period = latestKey
      ? data.structure?.dimensions?.observation?.[0]?.values?.[Number(latestKey)]?.id
      : undefined;

    if (latestKey === undefined || Number.isNaN(Number(numericValue))) {
      return {
        id: "EURUSD",
        label: "EUR/USD",
        value: "X",
        source: "ECB",
        status: "missing-data",
        error: "No EUR/USD observation returned by ECB.",
      };
    }

    return {
      id: "EURUSD",
      label: "EUR/USD",
      value: Number(numericValue).toFixed(4),
      rawValue: Number(numericValue),
      period,
      source: "ECB",
      status: "online",
    };
  } catch (error) {
    return {
      id: "EURUSD",
      label: "EUR/USD",
      value: "X",
      source: "ECB",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown ECB error.",
    };
  }
};

export const getEcbHealth = async (): Promise<SourceHealth> => {
  const metric = await getEurUsd();
  return {
    id: "ecb",
    name: "ECB",
    status: metric.status === "online" ? "online" : metric.status,
    description: "European rates, FX reference rates, inflation and banking data.",
    lastUpdated: metric.period,
    error: metric.error,
  };
};
