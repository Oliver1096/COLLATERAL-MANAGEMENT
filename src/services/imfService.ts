import { cachedJson } from "./http";
import type { SourceHealth } from "../types/market";

interface ImfIndicatorsResponse {
  indicators?: Record<string, unknown>;
}

export const getImfHealth = async (): Promise<SourceHealth> => {
  try {
    const data = await cachedJson<ImfIndicatorsResponse>(
      "imf:indicators",
      "https://www.imf.org/external/datamapper/api/v1/indicators",
    );

    if (!data.indicators || Object.keys(data.indicators).length === 0) {
      return {
        id: "imf",
        name: "IMF",
        status: "missing-data",
        description: "Global macro, GDP, inflation, debt and current-account data.",
        error: "No IMF indicators returned.",
      };
    }

    return {
      id: "imf",
      name: "IMF",
      status: "online",
      description: "Global macro, GDP, inflation, debt and current-account data.",
      lastUpdated: "Indicators catalog",
    };
  } catch (error) {
    return {
      id: "imf",
      name: "IMF",
      status: "error",
      description: "Global macro, GDP, inflation, debt and current-account data.",
      error: error instanceof Error ? error.message : "Unknown IMF error.",
    };
  }
};
