import { readFileSync } from "node:fs";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const BANXICO_BASE = "https://www.banxico.org.mx/SieAPIRest/service/v1/series";
const GOLD_API_URL = "https://api.gold-api.com/price/XAU";
const WTI_URL = "https://api.eia.gov/v2/petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=10";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const validNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/,/g, "").trim();
  if (!text || text === "." || text.toUpperCase() === "NA") return null;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
};
const fmt = (value: number | null, suffix = "%", decimals = 2) => value === null ? "X" : `${value.toFixed(decimals)}${suffix}`;
const fmtPlain = (value: number | null, decimals = 2) => value === null ? "X" : value.toFixed(decimals);
const unavailable = (source = "Pending", date: string | null = null) => ({ value: "X", source, date });
const rowX = (base: Record<string, unknown> = {}) => ({ ...base, yield: "X", change: "X", source: "Pending", date: null });
const delay = () => sleep(160);

async function fetchJson(url: string, headers: Record<string, string> = {}, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < retries) {
          await sleep(350 * 2 ** attempt);
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      if (attempt >= retries) throw error;
      await sleep(350 * 2 ** attempt);
    }
  }
}

async function fredSeries(id: string, limit = 20) {
  const key = process.env.VITE_FRED_API_KEY;
  if (!key) return null;
  await delay();
  const url = `${FRED_BASE}?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  const data = await fetchJson(url);
  if (data.error_message) return null;
  const valid = (data.observations ?? []).filter((obs: any) => validNumber(obs.value) !== null);
  if (!valid.length) return null;
  const latest = valid[0];
  const previous = valid[1];
  const value = validNumber(latest.value);
  const prevValue = previous ? validNumber(previous.value) : null;
  return {
    id,
    value,
    date: latest.date ?? null,
    previousValue: prevValue,
    changeBps: value !== null && prevValue !== null ? (value - prevValue) * 100 : null,
    observations: valid,
  };
}

async function fredCard(name: string, id: string, decimals = 2, suffix = "%") {
  try {
    const data = await fredSeries(id);
    return data ? { name, value: fmt(data.value, suffix, decimals), source: "FRED", date: data.date } : { name, ...unavailable() };
  } catch {
    return { name, ...unavailable() };
  }
}

async function fredRow(instrument: string, tenor: string, id: string, decimals = 2) {
  try {
    const data = await fredSeries(id);
    return data
      ? { instrument, tenor, yield: fmt(data.value, "%", decimals), change: data.changeBps === null ? "X" : `${data.changeBps >= 0 ? "+" : ""}${data.changeBps.toFixed(1)} bps`, source: "FRED", date: data.date }
      : rowX({ instrument, tenor });
  } catch {
    return rowX({ instrument, tenor });
  }
}

async function banxicoSeries(ids: string[]) {
  const token = process.env.VITE_BANXICO_TOKEN;
  if (!token) return new Map<string, any>();
  try {
    const data = await fetchJson(`${BANXICO_BASE}/${ids.join(",")}/datos/oportuno?mediaType=json&token=${token}`);
    const map = new Map<string, any>();
    for (const serie of data.bmx?.series ?? []) {
      const datum = serie.datos?.[0];
      map.set(serie.idSerie, { title: serie.titulo, value: validNumber(datum?.dato), date: datum?.fecha ?? null });
    }
    return map;
  } catch {
    return new Map<string, any>();
  }
}

const banxicoValue = (map: Map<string, any>, id: string, name: string, decimals = 2, suffix = "%") => {
  const row = map.get(id);
  return row && row.value !== null
    ? { name, value: fmt(row.value, suffix, decimals), source: "Banxico", date: row.date }
    : { name, ...unavailable() };
};

async function nyFedSofr() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 35);
  try {
    const data = await fetchJson(`https://markets.newyorkfed.org/api/rates/secured/sofr/search.json?startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}&type=rate`);
    const row = data.refRates?.find((item: any) => validNumber(item.percentRate) !== null);
    const value = validNumber(row?.percentRate);
    return value !== null ? { name: "SOFR", value: fmt(value), source: "NY Fed", date: row.effectiveDate } : { name: "SOFR", ...unavailable() };
  } catch {
    return { name: "SOFR", ...unavailable() };
  }
}

async function eiaWti() {
  const key = process.env.VITE_EIA_API_KEY;
  if (!key) return { value: "X", change: "X", source: "Pending", date: null };
  try {
    const data = await fetchJson(`${WTI_URL}&api_key=${key}`);
    const rows = data.response?.data ?? [];
    const latest = rows.find((row: any) => validNumber(row.value) !== null);
    const prev = rows.slice(1).find((row: any) => validNumber(row.value) !== null);
    const value = validNumber(latest?.value);
    const prevValue = validNumber(prev?.value);
    return {
      value: value === null ? "X" : value.toFixed(2),
      change: value !== null && prevValue !== null ? `${(((value - prevValue) / prevValue) * 100).toFixed(2)}%` : "X",
      source: "EIA",
      date: latest?.period ?? null,
    };
  } catch {
    return { value: "X", change: "X", source: "Pending", date: null };
  }
}

async function goldPrice() {
  try {
    const data = await fetchJson(GOLD_API_URL);
    const value = validNumber(data.price);
    return { value: value === null ? "X" : value.toFixed(2), change: "X", source: "Gold-API", date: data.updatedAt ?? null };
  } catch {
    return { value: "X", change: "X", source: "Pending", date: null };
  }
}

async function pceInflation() {
  try {
    const data = await fredSeries("PCEPI", 18);
    const obs = data?.observations ?? [];
    const latest = obs[0];
    const yearAgo = obs[12];
    const latestValue = validNumber(latest?.value);
    const yearAgoValue = validNumber(yearAgo?.value);
    if (latestValue === null || yearAgoValue === null) return { name: "Inflation PCE", ...unavailable() };
    const yoy = ((latestValue / yearAgoValue) - 1) * 100;
    return { name: "Inflation PCE", value: fmt(yoy), source: "FRED", date: latest.date };
  } catch {
    return { name: "Inflation PCE", ...unavailable() };
  }
}

async function buildOverview() {
  const banxicoIds = ["SF61745", "SF331451", "SF43783", "SP68257", "SF43718", "SF60633", "SF60634", "SF60635", "SF60636"];
  const banxico = await banxicoSeries(banxicoIds);

  const [sofr, gdp, unrate, pce, fedFunds] = await Promise.all([
    nyFedSofr(),
    fredCard("GDP", "A191RL1Q225SBEA", 2, "%"),
    fredCard("Unemployment Rate", "UNRATE", 2, "%"),
    pceInflation(),
    fredCard("Policy Rate", "FEDFUNDS", 2, "%"),
  ]);

  const [ust2, ust3, ust5, ust10, ust30] = await Promise.all([
    fredRow("UST 2Y", "2Y", "DGS2"), fredRow("UST 3Y", "3Y", "DGS3"), fredRow("UST 5Y", "5Y", "DGS5"), fredRow("UST 10Y", "10Y", "DGS10"), fredRow("UST 30Y", "30Y", "DGS30"),
  ]);
  const [tips5, tips10] = await Promise.all([fredRow("TIPS 5Y", "5Y", "DFII5"), fredRow("TIPS 10Y", "10Y", "DFII10")]);
  const [bei5, bei10] = await Promise.all([fredRow("B/E 5Y", "5Y", "T5YIE"), fredRow("B/E 10Y", "10Y", "T10YIE")]);
  const [hy, ig] = await Promise.all([fredCard("HY", "BAMLH0A0HYM2", 0, " bps"), fredCard("IG", "BAMLC0A0CM", 0, " bps")]);
  const [brent, gbp, eur, chf] = await Promise.all([
    fredCard("Brent", "DCOILBRENTEU", 2, ""), fredCard("GBP / USD", "DEXUSUK", 4, ""), fredCard("EUR / USD", "DEXUSEU", 4, ""), fredCard("CHF / USD", "DEXSZUS", 4, ""),
  ]);
  const [wti, gold] = await Promise.all([eiaWti(), goldPrice()]);

  const now = new Date().toISOString();
  const sources = new Set<string>();
  const touchSource = (item: any) => { if (item?.source && item.source !== "Pending") sources.add(item.source); };

  const banxicoCards = [
    banxicoValue(banxico, "SF61745", "Tasa Objetivo"),
    banxicoValue(banxico, "SF331451", "TIIE Fondeo"),
    banxicoValue(banxico, "SF43783", "Bancario"),
    banxicoValue(banxico, "SP68257", "UDIS", 6, ""),
    banxicoValue(banxico, "SF43718", "Tipo de Cambio FIX", 4, ""),
    { name: "Inflación", ...unavailable() },
    { name: "Inflación Subyacente", ...unavailable() },
  ];
  banxicoCards.forEach(touchSource);

  const cetes = [
    { title: "CETES", days: "28", ...(() => { const v = banxicoValue(banxico, "SF60633", "CETES 28"); return { rate: v.value, variation: "X", source: v.source, date: v.date }; })() },
    { title: "CETES", days: "91", ...(() => { const v = banxicoValue(banxico, "SF60634", "CETES 91"); return { rate: v.value, variation: "X", source: v.source, date: v.date }; })() },
    { title: "CETES", days: "182", ...(() => { const v = banxicoValue(banxico, "SF60635", "CETES 182"); return { rate: v.value, variation: "X", source: v.source, date: v.date }; })() },
    { title: "CETES", days: "364", ...(() => { const v = banxicoValue(banxico, "SF60636", "CETES 364"); return { rate: v.value, variation: "X", source: v.source, date: v.date }; })() },
    { title: "CETES", days: "692", rate: "X", variation: "X", source: "Pending", date: null },
  ];

  const fedCards = [fedFunds, sofr, gdp, unrate, pce]; fedCards.forEach(touchSource);
  [ust2, ust3, ust5, ust10, ust30, tips5, tips10, bei5, bei10, hy, ig, brent, gbp, eur, chf, wti, gold].forEach(touchSource);
  cetes.forEach(touchSource);

  return {
    success: true,
    last_updated: now,
    sources_connected: [...sources],
    mexico: {
      banxico_cards: banxicoCards,
      mbonos: [rowX({ instrument: "M28", tenor: "2Y" }), rowX({ instrument: "M29", tenor: "3Y" }), rowX({ instrument: "M32", tenor: "5Y" }), rowX({ instrument: "M36", tenor: "10Y" })],
      udibonos: [rowX({ instrument: "UDI 28", tenor: "2Y" }), rowX({ instrument: "UDI 29", tenor: "3Y" }), rowX({ instrument: "UDI 31", tenor: "5Y" }), rowX({ instrument: "UDI 36", tenor: "10Y" })],
      bei: [rowX({ instrument: "M28", tenor: "2Y" }), rowX({ instrument: "M29", tenor: "5Y" }), rowX({ instrument: "M32", tenor: "10Y" })],
      cetes,
    },
    usa: {
      fed_cards: fedCards,
      ust: [ust2, ust3, ust5, ust10, ust30],
      tips: [rowX({ instrument: "TIPS 2Y", tenor: "2Y" }), rowX({ instrument: "TIPS 3Y", tenor: "3Y" }), tips5, tips10],
      bei: [rowX({ instrument: "B/E 2Y", tenor: "2Y" }), rowX({ instrument: "B/E 3Y", tenor: "3Y" }), bei5, bei10],
      spreads: [{ spread: "HY", bps: hy.value, source: hy.source, date: hy.date }, { spread: "IG", bps: ig.value, source: ig.source, date: ig.date }, { spread: "SRLN", bps: "X", source: "Pending", date: null }],
      commodities: [{ commodity: "WTI", price: wti.value, one_week_change: wti.change, source: wti.source, date: wti.date }, { commodity: "Brent", price: brent.value, one_week_change: "X", source: brent.source, date: brent.date }, { commodity: "Spot Gold", price: gold.value, one_week_change: "X", source: gold.source, date: gold.date }, { commodity: "Spot Silver", price: "X", one_week_change: "X", source: "Pending", date: null }],
      fx: [{ fx: "USD / MXN", value: banxicoValue(banxico, "SF43718", "USD / MXN", 4, "").value, source: "Banxico", date: banxico.get("SF43718")?.date ?? null }, { fx: "GBP / USD", value: gbp.value, source: gbp.source, date: gbp.date }, { fx: "EUR / USD", value: eur.value, source: eur.source, date: eur.date }, { fx: "CHF / USD", value: chf.value, source: chf.source, date: chf.date }],
    },
  };
}

export { buildOverview as buildFixedIncomeOverview };
