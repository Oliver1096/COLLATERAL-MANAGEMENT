import { apiConfig, hasApiKey } from "./config";
import { buildQuery, cachedJson } from "./http";
import { formatDate, formatRate, sparklineFromValues, unavailableRate } from "./fixedIncomeFormat";

const FRED_SERIES_PATH = "/series/observations";
const useProxy = () => import.meta.env.DEV || import.meta.env.VITE_USE_API_PROXY === "true";

const fredUrl = (query) =>
  useProxy() ? `/api/fred${FRED_SERIES_PATH}?${query}` : `https://api.stlouisfed.org/fred${FRED_SERIES_PATH}?${query}`;

export const getFredRate = async ({ id, name, region = "United States", source = "FRED", methodLabel = "Annualized rate" }) => {
  if (!useProxy() && !hasApiKey(apiConfig.fredApiKey)) {
    return unavailableRate({ id, name, region, source, status: "missing-key", error: "VITE_FRED_API_KEY is not configured." });
  }

  try {
    const query = buildQuery({
      series_id: id,
      api_key: useProxy() ? undefined : apiConfig.fredApiKey,
      file_type: "json",
      sort_order: "desc",
      limit: 10,
    });
    const data = await cachedJson(`fi:fred:${id}`, fredUrl(query), 1000 * 60 * 10, (response) => !response.error_message);
    if (data.error_message) throw new Error(data.error_message);

    const observations = data.observations ?? [];
    const latest = observations.find((item) => item.value !== "." && Number.isFinite(Number(item.value)));
    if (!latest) {
      return unavailableRate({ id, name, region, source, error: `FRED did not return a valid latest observation for ${id}.` });
    }

    const value = Number(latest.value);
    return {
      id,
      name,
      region,
      source,
      status: "online",
      statusLabel: "Live",
      value,
      displayValue: formatRate(value, Math.abs(value) < 1 ? 3 : 2),
      date: formatDate(latest.date),
      rawValue: value,
      normalizedValue: value,
      methodLabel,
      updateFrequency: "Daily / latest official observation",
      methodology: "Displayed directly as an annual percentage value from FRED. Missing '.' observations are ignored.",
      sparkline: sparklineFromValues(observations, (item) => item.value).reverse(),
    };
  } catch (error) {
    return unavailableRate({
      id,
      name,
      region,
      source,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown FRED error.",
    });
  }
};
