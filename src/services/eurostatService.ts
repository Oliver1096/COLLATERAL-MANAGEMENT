import { cachedJson } from "./http";
import type { MetricData, SourceHealth } from "../types/market";

interface EurostatResponse {
  value?: Record<string, number>;
}

export const getEurostatHealth = async (): Promise<SourceHealth> => {
  try {
    const url =
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10q_ggdebt?format=JSON&lang=en&geo=EA20&unit=PC_GDP&sector=S13&freq=Q";
    const data = await cachedJson<EurostatResponse>("eurostat:ea20-debt", url);

    if (!data.value || Object.keys(data.value).length === 0) {
      return {
        id: "eurostat",
        name: "Eurostat",
        status: "missing-data",
        description: "European fiscal data, debt, deficit and public-sector ratios.",
        error: "No Euro area debt-to-GDP observations returned.",
      };
    }

    return {
      id: "eurostat",
      name: "Eurostat",
      status: "online",
      description: "European fiscal data, debt, deficit and public-sector ratios.",
      lastUpdated: "EA20 government debt",
    };
  } catch (error) {
    return {
      id: "eurostat",
      name: "Eurostat",
      status: "error",
      description: "European fiscal data, debt, deficit and public-sector ratios.",
      error: error instanceof Error ? error.message : "Unknown Eurostat error.",
    };
  }
};


export const getEuroAreaDebtToGdp = async (): Promise<MetricData> => {
  try {
    const url =
      "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10q_ggdebt?format=JSON&lang=en&geo=EA20&unit=PC_GDP&sector=S13&freq=Q";
    const data = await cachedJson<EurostatResponse>("eurostat:ea20-debt", url);
    const entries = Object.entries(data.value ?? {})
      .map(([key, value]) => ({ key: Number(key), value }))
      .filter((entry) => !Number.isNaN(entry.key) && typeof entry.value === "number")
      .sort((a, b) => b.key - a.key);
    const latest = entries[0];

    if (!latest) {
      return {
        id: "EA20_DEBT_GDP",
        label: "Euro Area Debt/GDP",
        value: "X",
        unit: "% GDP",
        source: "Eurostat",
        status: "missing-data",
        error: "No Euro area debt-to-GDP observations returned.",
      };
    }

    return {
      id: "EA20_DEBT_GDP",
      label: "Euro Area Debt/GDP",
      value: latest.value.toFixed(1),
      rawValue: latest.value,
      unit: "% GDP",
      period: "Latest available quarter",
      source: "Eurostat",
      status: "online",
    };
  } catch (error) {
    return {
      id: "EA20_DEBT_GDP",
      label: "Euro Area Debt/GDP",
      value: "X",
      unit: "% GDP",
      source: "Eurostat",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown Eurostat error.",
    };
  }
};
