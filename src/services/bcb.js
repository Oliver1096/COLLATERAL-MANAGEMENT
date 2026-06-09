import { cachedJson } from "./http";
import { annualizeDailyRate, formatDate, formatRate, latestValid, parseValidRate, sparklineFromValues, unavailableRate } from "./fixedIncomeFormat";

const configs = {
  cdi: {
    id: "BRAZIL_CDI",
    name: "CDI",
    url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/10?formato=json",
  },
  selic: {
    id: "BRAZIL_SELIC",
    name: "SELIC",
    url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/10?formato=json",
  },
};

export const getBcbCompoundedRate = async (kind) => {
  const config = configs[kind];
  try {
    const data = await cachedJson(`fi:bcb:${kind}`, config.url, 1000 * 60 * 10);
    const latest = latestValid(data, (item) => item.valor);
    if (!latest) {
      return unavailableRate({ id: config.id, name: config.name, region: "Brazil", source: "Banco Central do Brasil", error: "BCB did not return a valid daily observation." });
    }

    const dailyRate = parseValidRate(latest.valor);
    const annualized = annualizeDailyRate(dailyRate);
    return {
      id: config.id,
      name: config.name,
      region: "Brazil",
      source: "Banco Central do Brasil",
      status: "online",
      statusLabel: "Live",
      value: annualized,
      displayValue: formatRate(annualized, 2),
      date: formatDate(latest.data),
      rawValue: dailyRate,
      normalizedValue: annualized,
      methodLabel: "Annualized compounded rate",
      updateFrequency: "Daily official observation",
      methodology: "BCB returns a daily percentage value. Display annualized compounded rate using ((1 + dailyRate / 100) ** 252 - 1) * 100.",
      sparkline: sparklineFromValues(data, (item) => {
        const daily = parseValidRate(item.valor);
        return daily === null ? null : annualizeDailyRate(daily);
      }),
    };
  } catch (error) {
    return unavailableRate({ id: config.id, name: config.name, region: "Brazil", source: "Banco Central do Brasil", status: "error", error: error instanceof Error ? error.message : "Unknown BCB error." });
  }
};
