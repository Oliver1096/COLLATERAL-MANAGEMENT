import { cachedJson } from "./http";
import { formatDate, formatRate, unavailableRate } from "./fixedIncomeFormat";

const BOJ_PATH = "/api/v1/getDataCode?format=json&lang=en&db=FM01&code=STRDCLUCON&startDate=202501";
const useProxy = () => import.meta.env.DEV || import.meta.env.VITE_USE_API_PROXY === "true";
const bojUrl = () => (useProxy() ? `/api/boj${BOJ_PATH}` : `https://www.stat-search.boj.or.jp${BOJ_PATH}`);

export const getJapanTonaRate = async () => {
  try {
    const data = await cachedJson("fi:boj:tona", bojUrl(), 1000 * 60 * 10);
    const values = data?.RESULTSET?.[0]?.VALUES;
    const dates = values?.SURVEY_DATES ?? [];
    const observations = values?.VALUES ?? [];
    let latest = null;

    for (let index = observations.length - 1; index >= 0; index -= 1) {
      const value = Number(observations[index]);
      if (Number.isFinite(value)) {
        latest = { date: dates[index], value };
        break;
      }
    }

    if (!latest) {
      return unavailableRate({ id: "JAPAN_TONA", name: "Japan TONA", region: "Japan", source: "Bank of Japan", error: "BOJ did not return a valid latest observation." });
    }

    const sparkline = observations
      .map((value, index) => ({ value: Number(value), date: dates[index] }))
      .filter((item) => Number.isFinite(item.value))
      .slice(-10)
      .map((item) => item.value);

    return {
      id: "JAPAN_TONA",
      name: "Japan TONA",
      region: "Japan",
      source: "Bank of Japan",
      status: "online",
      statusLabel: "Live",
      value: latest.value,
      displayValue: formatRate(latest.value, 3),
      date: formatDate(latest.date),
      rawValue: latest.value,
      normalizedValue: latest.value,
      methodLabel: "Percent per annum",
      updateFrequency: "Daily official observation",
      methodology: "Bank of Japan FM01 STRDCLUCON. Value is already percent per annum and displayed directly.",
      sparkline,
    };
  } catch (error) {
    return unavailableRate({ id: "JAPAN_TONA", name: "Japan TONA", region: "Japan", source: "Bank of Japan", status: "error", error: error instanceof Error ? error.message : "Unknown BOJ error." });
  }
};
