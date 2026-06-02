import { cachedJson } from "./http";

const GOLD_API_URL = "https://api.gold-api.com/price/XAU";

const formatGoldPrice = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatTimestamp = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
};

const localFetchTimestamp = () =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date());

const goldTimestampLabel = (data) => {
  const apiTimestamp = formatTimestamp(data?.updatedAt ?? data?.timestamp ?? data?.updated_at);

  if (apiTimestamp) return `Last updated: ${apiTimestamp}`;
  if (data?.updatedAtReadable) return `Last updated: ${data.updatedAtReadable}`;

  return `Fetched at: ${localFetchTimestamp()}`;
};

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
        period: `Fetched at: ${localFetchTimestamp()}`,
        error: "Gold-API did not return a valid price field.",
      };
    }

    return {
      id: data?.symbol ?? "GOLD",
      label: data?.name ?? "Gold",
      value: formatGoldPrice(numericValue),
      rawValue: numericValue,
      unit: `${data?.currency ?? "USD"}/oz`,
      period: goldTimestampLabel(data),
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
      period: `Fetched at: ${localFetchTimestamp()}`,
      error: error instanceof Error ? error.message : "Unknown Gold-API error.",
    };
  }
};
