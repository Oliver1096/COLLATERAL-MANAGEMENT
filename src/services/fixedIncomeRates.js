import { getTiieFondeoRate } from "./banxico";
import { getBcbCompoundedRate } from "./bcb";
import { getFredRate } from "./fred";
import { getJapanTonaRate } from "./boj";
import { getSofrRate } from "./nyfed";

const settle = async (promise, fallback) => {
  try {
    return await promise;
  } catch (error) {
    return { ...fallback, status: "error", statusLabel: "Fallback", error: error instanceof Error ? error.message : "Unknown error" };
  }
};

const delay = (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const withFallbacks = async (primaryConfig, fallbackConfigs = []) => {
  const primaryRate = await getFredRate(primaryConfig);
  if (primaryRate.status === "online") {
    return { ...primaryRate, statusLabel: "Official" };
  }

  for (const fallbackConfig of fallbackConfigs) {
    await delay(175);
    const fallbackRate = await getFredRate(fallbackConfig);
    if (fallbackRate.status === "online") {
      return {
        ...fallbackRate,
        id: primaryConfig.id,
        name: primaryConfig.name,
        statusLabel: "Fallback",
        methodLabel: `${fallbackRate.methodLabel} · fallback series ${fallbackConfig.id}`,
        methodology: `${fallbackRate.methodology} Primary FRED series ${primaryConfig.id} was unavailable, so ${fallbackConfig.id} is displayed as fallback.`,
      };
    }
  }

  return { ...primaryRate, statusLabel: primaryRate.status === "online" ? "Official" : primaryRate.statusLabel };
};

const loadFredTreasuries = async () => {
  const configs = [
    { primary: { id: "DGS1MO", name: "1M Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [{ id: "DTB4WK", name: "1M Treasury", region: "United States", methodLabel: "Annualized discount-bill rate" }] },
    { primary: { id: "DGS3MO", name: "3M Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [{ id: "DTB3", name: "3M Treasury", region: "United States", methodLabel: "Annualized 3M T-bill secondary market rate" }, { id: "TB3MS", name: "3M Treasury", region: "United States", methodLabel: "Monthly 3M Treasury bill rate" }] },
    { primary: { id: "DGS6MO", name: "6M Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [{ id: "DTB6", name: "6M Treasury", region: "United States", methodLabel: "Annualized 6M T-bill secondary market rate" }, { id: "TB6MS", name: "6M Treasury", region: "United States", methodLabel: "Monthly 6M Treasury bill rate" }] },
    { primary: { id: "DGS1", name: "1Y Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [] },
  ];
  const rates = [];

  for (const [index, config] of configs.entries()) {
    if (index > 0) await delay(175);
    rates.push(await withFallbacks(config.primary, config.fallbacks));
  }

  return rates;
};

export const loadFixedIncomeRates = async () => {
  const [sofr, tiie, estr, cdi, selic, tona] = await Promise.all([
    settle(getSofrRate(), { id: "SOFR", name: "SOFR", region: "United States", source: "New York Fed", displayValue: "X" }),
    settle(getTiieFondeoRate(), { id: "TIIE_FONDEO_1D", name: "TIIE Fondeo 1D", region: "México", source: "Banxico", displayValue: "X" }),
    settle(getFredRate({ id: "ECBESTRVOLWGTTRMDMNRT", name: "€STR", region: "Euro Area", source: "ECB via FRED", methodLabel: "Annualized official rate" }), { id: "ESTR", name: "€STR", region: "Euro Area", source: "ECB via FRED", displayValue: "X" }),
    settle(getBcbCompoundedRate("cdi"), { id: "BRAZIL_CDI", name: "CDI", region: "Brazil", source: "Banco Central do Brasil", displayValue: "X" }),
    settle(getBcbCompoundedRate("selic"), { id: "BRAZIL_SELIC", name: "SELIC", region: "Brazil", source: "Banco Central do Brasil", displayValue: "X" }),
    settle(getJapanTonaRate(), { id: "JAPAN_TONA", name: "Japan TONA", region: "Japan", source: "Bank of Japan", displayValue: "X" }),
  ]);

  const treasuries = await loadFredTreasuries();

  return { interbank: [sofr, tiie, estr, cdi, selic, tona], treasuries, fetchedAt: new Date().toISOString() };
};
