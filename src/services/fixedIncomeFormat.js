export const formatRate = (value, decimals = 2) =>
  Number.isFinite(value) ? value.toFixed(decimals) : "X";

export const formatDate = (dateLike) => {
  if (!dateLike) return "Unavailable";
  const raw = String(dateLike);
  let date;

  if (/^\d{8}$/.test(raw)) {
    date = new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00Z`);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("/");
    date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  } else {
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

export const parseValidRate = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized || normalized === "." || normalized.toUpperCase() === "NA") return null;
    const numeric = Number(normalized.replace(/,/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const latestValid = (items, valueGetter) =>
  [...(items ?? [])].reverse().find((item) => parseValidRate(valueGetter(item)) !== null);

export const validNumericValues = (values, transform = (value) => value) =>
  (values ?? [])
    .map((item) => parseValidRate(transform(item)))
    .filter((value) => value !== null);

export const sparklineFromValues = (values, transform = (value) => value) => validNumericValues(values, transform).slice(-10);

export const annualizeDailyRate = (dailyRate) => ((1 + dailyRate / 100) ** 252 - 1) * 100;

export const unavailableRate = ({ id, name, region, source, error, status = "missing-data", methodLabel = "Data unavailable" }) => ({
  id,
  name,
  region,
  source,
  status,
  statusLabel: status === "error" ? "Fallback" : "Missing",
  value: null,
  displayValue: "X",
  date: "Unavailable",
  rawValue: null,
  normalizedValue: null,
  methodLabel,
  updateFrequency: "Unavailable",
  methodology: error ?? "Source did not return a valid latest observation.",
  sparkline: [],
  error,
});

export const formatBpsChange = (bps) => {
  if (!Number.isFinite(bps)) return "1W: N/A";
  const sign = bps > 0 ? "+" : "";
  return `1W: ${sign}${bps.toFixed(1)} bps`;
};

export const oneWeekChangeFromValues = (values) => {
  const valid = validNumericValues(values);
  if (valid.length < 6) return { oneWeekChangeBps: null, oneWeekChangeLabel: "1W: N/A" };

  const latestValidRate = valid[valid.length - 1];
  const rateFiveValidObservationsAgo = valid[valid.length - 6];
  const oneWeekChangeBps = (latestValidRate - rateFiveValidObservationsAgo) * 100;

  return { oneWeekChangeBps, oneWeekChangeLabel: formatBpsChange(oneWeekChangeBps) };
};
