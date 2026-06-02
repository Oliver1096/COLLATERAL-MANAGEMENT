import { cachedJson } from "./http";

const GOLD_API_URL = "https://api.gold-api.com/price/XAU";

const formatGoldPrice = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const getGoldPrice = async () => {
  try {
    const data = await cachedJson("gold-api:xau", GOLD_API_URL, 1000 * 60 * 5);
    const numericValue = Number(data?.price);

    if (Number.isNaN(numericValue)) {
      return {
        id: "GOLD",
        label: "Gold",
        value: "X",
        unit: "USD/oz",
        source: "Gold-API",
        status: "missing-data",
        error: "Gold-API did not return a valid price field.",
      };
    }

    return {
      id: data?.symbol ?? "GOLD",
      label: data?.name ?? "Gold",
      value: formatGoldPrice(numericValue),
      rawValue: numericValue,
      unit: `${data?.currency ?? "USD"}/oz`,
      period: data?.updatedAtReadable ?? data?.updatedAt,
      source: "Gold-API",
      status: "online",
    };
  } catch (error) {
    return {
      id: "GOLD",
      label: "Gold",
      value: "X",
      unit: "USD/oz",
      source: "Gold-API",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown Gold-API error.",
    };
  }
};
