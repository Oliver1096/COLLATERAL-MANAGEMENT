import { apiConfig, hasApiKey } from "./config";
import { cachedJson } from "./http";
import { formatDate, formatRate, unavailableRate } from "./fixedIncomeFormat";

const BANXICO_PATH = "/SieAPIRest/service/v1/series/SF331451/datos/oportuno?mediaType=json";
const useProxy = () => import.meta.env.DEV || import.meta.env.VITE_USE_API_PROXY === "true";
const banxicoToken = () => import.meta.env.VITE_BANXICO_TOKEN ?? "";
const banxicoUrl = () =>
  useProxy()
    ? `/api/banxico${BANXICO_PATH}`
    : `https://www.banxico.org.mx${BANXICO_PATH}&token=${banxicoToken()}`;

export const getTiieFondeoRate = async () => {
  if (!hasApiKey(banxicoToken())) {
    return unavailableRate({
      id: "TIIE_FONDEO_1D",
      name: "TIIE Fondeo 1D",
      region: "México",
      source: "Banxico",
      status: "missing-key",
      error: "VITE_BANXICO_TOKEN is not configured.",
      methodLabel: "Annualized official rate",
    });
  }

  try {
    const data = await cachedJson("fi:banxico:tiie-fondeo-1d", banxicoUrl(), 1000 * 60 * 10);
    const row = data?.bmx?.series?.[0]?.datos?.find((item) => Number.isFinite(Number(String(item.dato).replace(',', ''))));
    if (!row) {
      return unavailableRate({ id: "TIIE_FONDEO_1D", name: "TIIE Fondeo 1D", region: "México", source: "Banxico", error: "Banxico did not return a valid latest observation." });
    }

    const value = Number(String(row.dato).replace(',', ''));
    return {
      id: "TIIE_FONDEO_1D",
      name: "TIIE Fondeo 1D",
      region: "México",
      source: "Banxico",
      status: "online",
      statusLabel: "Live",
      value,
      displayValue: formatRate(value, 2),
      date: formatDate(row.fecha),
      rawValue: value,
      normalizedValue: value,
      oneWeekChangeBps: null,
      oneWeekChangeLabel: "1W: N/A",
      methodLabel: "Annualized official rate",
      updateFrequency: "Official opportuno observation",
      methodology: "Uses Banxico series SF331451. Displayed directly as annual percentage value.",
      sparkline: [value],
    };
  } catch (error) {
    return unavailableRate({ id: "TIIE_FONDEO_1D", name: "TIIE Fondeo 1D", region: "México", source: "Banxico", status: "error", error: error instanceof Error ? error.message : "Unknown Banxico error." });
  }
};
