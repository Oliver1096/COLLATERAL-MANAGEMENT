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

const loadFredTreasuries = async () => {
  const configs = [
    { id: "DGS1MO", name: "1M Treasury", region: "United States", methodLabel: "Annualized Treasury yield" },
    { id: "DGS3MO", name: "3M Treasury", region: "United States", methodLabel: "Annualized Treasury yield" },
    { id: "DGS6MO", name: "6M Treasury", region: "United States", methodLabel: "Annualized Treasury yield" },
    { id: "DGS1", name: "1Y Treasury", region: "United States", methodLabel: "Annualized Treasury yield" },
  ];
  const rates = [];

  for (const [index, config] of configs.entries()) {
    if (index > 0) await delay(175);
    const rate = await getFredRate(config);
    rates.push({ ...rate, statusLabel: rate.status === "online" ? "Official" : rate.statusLabel });
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
