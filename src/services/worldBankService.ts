import { cachedJson } from "./http";
import type { SourceHealth } from "../types/market";

interface WorldBankIndicator {
  date?: string;
  value?: number | null;
}

type WorldBankResponse = [unknown, WorldBankIndicator[]?];

export const getWorldBankHealth = async (): Promise<SourceHealth> => {
  try {
    const data = await cachedJson<WorldBankResponse>(
      "worldbank:mex-gdp",
      "https://api.worldbank.org/v2/country/MEX/indicator/NY.GDP.MKTP.CD?format=json&per_page=5",
    );
    const row = data[1]?.find((item) => item.value !== null && item.value !== undefined);

    if (!row) {
      return {
        id: "world-bank",
        name: "World Bank",
        status: "missing-data",
        description: "Country indicators, GDP, population, inflation and development data.",
        error: "No recent Mexico GDP observation returned.",
      };
    }

    return {
      id: "world-bank",
      name: "World Bank",
      status: "online",
      description: "Country indicators, GDP, population, inflation and development data.",
      lastUpdated: row.date,
    };
  } catch (error) {
    return {
      id: "world-bank",
      name: "World Bank",
      status: "error",
      description: "Country indicators, GDP, population, inflation and development data.",
      error: error instanceof Error ? error.message : "Unknown World Bank error.",
    };
  }
};
