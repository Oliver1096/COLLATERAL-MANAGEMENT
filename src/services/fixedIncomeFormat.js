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

export const latestValid = (items, valueGetter) => [...(items ?? [])].reverse().find((item) => {
  const value = Number(valueGetter(item));
  return Number.isFinite(value);
});

export const sparklineFromValues = (values, transform = (value) => value) =>
  (values ?? [])
    .map((item) => Number(transform(item)))
    .filter((value) => Number.isFinite(value))
    .slice(-10);

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
