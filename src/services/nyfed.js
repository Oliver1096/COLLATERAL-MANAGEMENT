import { cachedJson } from "./http";
import { formatDate, formatRate, sparklineFromValues, unavailableRate } from "./fixedIncomeFormat";

const isoDate = (date) => date.toISOString().slice(0, 10);

export const getSofrRate = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 45);

  try {
    const url = `https://markets.newyorkfed.org/api/rates/secured/sofr/search.json?startDate=${isoDate(startDate)}&endDate=${isoDate(endDate)}&type=rate`;
    const data = await cachedJson("fi:nyfed:sofr", url, 1000 * 60 * 10);
    const rows = data.refRates ?? [];
    const latest = rows.find((row) => Number.isFinite(Number(row.percentRate ?? row.rate)));
    if (!latest) return unavailableRate({ id: "SOFR", name: "SOFR", region: "United States", source: "New York Fed", error: "No valid SOFR rate returned." });

    const value = Number(latest.percentRate ?? latest.rate);
    return {
      id: "SOFR",
      name: "SOFR",
      region: "United States",
      source: "New York Fed",
      status: "online",
      statusLabel: "Live",
      value,
      displayValue: formatRate(value, 2),
      date: formatDate(latest.effectiveDate),
      rawValue: value,
      normalizedValue: value,
      methodLabel: "Annualized overnight financing rate",
      updateFrequency: "Daily official fixing",
      methodology: "Uses the latest valid percentRate from the New York Fed secured SOFR endpoint.",
      sparkline: sparklineFromValues(rows, (row) => row.percentRate ?? row.rate).reverse(),
    };
  } catch (error) {
    return unavailableRate({ id: "SOFR", name: "SOFR", region: "United States", source: "New York Fed", status: "error", error: error instanceof Error ? error.message : "Unknown NY Fed error." });
  }
};
