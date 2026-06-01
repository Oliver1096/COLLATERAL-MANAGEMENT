import { cachedJson } from "./http";
import type { SourceHealth } from "../types/market";

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
