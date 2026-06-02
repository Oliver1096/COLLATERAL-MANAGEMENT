import { getTiieFondeoRate } from "./banxico";
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

const FRED_REQUEST_DELAY_MS = 750;
const delay = (ms) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const withFallbacks = async (primaryConfig, fallbackConfigs = []) => {
  const primaryRate = await getFredRate(primaryConfig);
  if (primaryRate.status === "online") {
    return { ...primaryRate, statusLabel: "Official" };
  }

  for (const fallbackConfig of fallbackConfigs) {
    await delay(FRED_REQUEST_DELAY_MS);
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
    { primary: { id: "DGS3", name: "3Y Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [{ id: "GS3", name: "3Y Treasury", region: "United States", methodLabel: "Monthly 3Y Treasury constant maturity rate" }] },
    { primary: { id: "DGS5", name: "5Y Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [{ id: "GS5", name: "5Y Treasury", region: "United States", methodLabel: "Monthly 5Y Treasury constant maturity rate" }] },
    { primary: { id: "DGS7", name: "7Y Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [{ id: "GS7", name: "7Y Treasury", region: "United States", methodLabel: "Monthly 7Y Treasury constant maturity rate" }] },
    { primary: { id: "DGS10", name: "10Y Treasury", region: "United States", methodLabel: "Annualized Treasury yield" }, fallbacks: [{ id: "GS10", name: "10Y Treasury", region: "United States", methodLabel: "Monthly 10Y Treasury constant maturity rate" }] },
  ];
  const rates = [];

  for (const [index, config] of configs.entries()) {
    if (index > 0) await delay(FRED_REQUEST_DELAY_MS);
    rates.push(await withFallbacks(config.primary, config.fallbacks));
  }

  return rates;
};

const loadFredInterbankRates = async () => {
  const configs = [
    { id: "ECBESTRVOLWGTTRMDMNRT", name: "€STR", region: "Euro Area", source: "ECB via FRED", methodLabel: "Annualized official rate" },
    { id: "IUDSOIA", name: "SONIA", region: "United Kingdom", source: "Bank of England via FRED", methodLabel: "Annualized official overnight rate" },
  ];
  const rates = [];

  for (const [index, config] of configs.entries()) {
    if (index > 0) await delay(FRED_REQUEST_DELAY_MS);
    rates.push(await getFredRate(config));
  }

  return rates;
};

export const loadFixedIncomeRates = async () => {
  const nonFredRatesPromise = Promise.all([
    settle(getSofrRate(), { id: "SOFR", name: "SOFR", region: "United States", source: "New York Fed", displayValue: "X" }),
    settle(getTiieFondeoRate(), { id: "TIIE_FONDEO_1D", name: "TIIE Fondeo 1D", region: "México", source: "Banxico", displayValue: "X" }),
    settle(getJapanTonaRate(), { id: "JAPAN_TONA", name: "Japan TONA", region: "Japan", source: "Bank of Japan", displayValue: "X" }),
  ]);

  const [estr, sonia] = await loadFredInterbankRates();
  await delay(FRED_REQUEST_DELAY_MS);
  const treasuries = await loadFredTreasuries();
  const [sofr, tiie, tona] = await nonFredRatesPromise;

  return { interbank: [sofr, tiie, estr, sonia, tona], treasuries, fetchedAt: new Date().toISOString() };
};
