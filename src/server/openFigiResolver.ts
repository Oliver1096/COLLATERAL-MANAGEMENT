import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const OPENFIGI_MAPPING_URL = "https://api.openfigi.com/v3/mapping";
const OPENFIGI_SEARCH_URL = "https://api.openfigi.com/v3/search";
const IDENTIFIER_FALLBACK_PATH = path.resolve(process.cwd(), "server/data/fund_identifier_fallbacks.csv");
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

export interface OpenFigiCandidate {
  ticker: string;
  name?: string;
  exchange?: string;
  security_type?: string;
  security_type2?: string;
  market_sector?: string;
  figi?: string;
  composite_figi?: string;
  share_class_figi?: string;
  security_description?: string;
  isin?: string | null;
  cusip?: string | null;
  identifier_source?: string;
  score?: number;
}

export interface ResolvedInstrument extends OpenFigiCandidate {
  input: string;
  resolved_ticker: string;
  resolution_source: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value: unknown) => value === null || value === undefined ? "" : String(value).trim();
const normalize = (value: string) => value.trim().toUpperCase();
const isIsin = (query: string) => /^[A-Z]{2}[A-Z0-9]{10}$/.test(normalize(query));
const isCusip = (query: string) => /^[A-Z0-9]{9}$/.test(normalize(query));
const isTicker = (query: string) => /^[A-Z0-9.\-]{1,6}$/.test(normalize(query));
const fundish = (item: OpenFigiCandidate) => /ETF|FUND|TRUST|ETP|OPEN-END|MUTUAL/i.test(`${item.name ?? ""} ${item.security_type ?? ""} ${item.security_type2 ?? ""} ${item.security_description ?? ""}`);

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else current += char;
  }
  result.push(current);
  return result;
};
const readIdentifierFallbacks = () => {
  if (!existsSync(IDENTIFIER_FALLBACK_PATH)) return [];
  const lines = readFileSync(IDENTIFIER_FALLBACK_PATH, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, index) => { row[key] = values[index] ?? ""; });
    return {
      symbol: normalize(row.symbol ?? ""),
      name: clean(row.name),
      cusip: normalize(row.cusip ?? ""),
      isin: normalize(row.isin ?? ""),
    };
  }).filter((row) => row.symbol && row.cusip && row.isin);
};
const identifierFallbacks = () => readIdentifierFallbacks();
const cusipFromIsin = (isin: string) => isIsin(isin) && isin.startsWith("US") ? isin.slice(2, 11) : null;
const isinCheckDigit = (body: string) => {
  const expanded = body.toUpperCase().split("").map((char) => {
    if (/\d/.test(char)) return char;
    const value = char.charCodeAt(0) - 55;
    return String(value);
  }).join("");
  let sum = 0;
  let doubleIt = true;
  for (let i = expanded.length - 1; i >= 0; i -= 1) {
    let n = Number(expanded[i]);
    if (doubleIt) n *= 2;
    sum += Math.floor(n / 10) + (n % 10);
    doubleIt = !doubleIt;
  }
  return String((10 - (sum % 10)) % 10);
};
const isinFromUsCusip = (cusip: string) => {
  const normalizedCusip = normalize(cusip);
  if (!isCusip(normalizedCusip)) return null;
  const body = `US${normalizedCusip}`;
  return `${body}${isinCheckDigit(body)}`;
};
const enrichIdentifiers = <T extends OpenFigiCandidate | ResolvedInstrument>(candidate: T, input = ""): T => {
  const ticker = normalize(candidate.ticker || (candidate as ResolvedInstrument).resolved_ticker || "");
  const byTicker = identifierFallbacks().find((row) => row.symbol === ticker);
  let isin = clean(candidate.isin) || byTicker?.isin || null;
  let cusip = clean(candidate.cusip) || byTicker?.cusip || null;

  const normalizedInput = normalize(input);
  if (!isin && isIsin(normalizedInput)) isin = normalizedInput;
  if (!cusip && isIsin(normalizedInput)) cusip = cusipFromIsin(normalizedInput);
  if (!cusip && isCusip(normalizedInput)) cusip = normalizedInput;
  if (!isin && cusip) isin = isinFromUsCusip(cusip);
  if (!cusip && isin) cusip = cusipFromIsin(isin);

  return {
    ...candidate,
    isin: isin || null,
    cusip: cusip || null,
    identifier_source: byTicker ? "server identifier fallback" : isin || cusip ? "input-derived" : "unavailable",
  };
};


async function openFigiFetch(url: string, body: unknown, attempt = 0): Promise<Response> {
  const apiKey = process.env.OPENFIGI_API_KEY;
  if (!apiKey) throw new Error("OPENFIGI_API_KEY is not configured.");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OPENFIGI-APIKEY": apiKey,
      },
      body: JSON.stringify(body),
    });
    if (RETRY_STATUSES.has(response.status) && attempt < 3) {
      await sleep(450 * 2 ** attempt);
      return openFigiFetch(url, body, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt < 3) {
      await sleep(450 * 2 ** attempt);
      return openFigiFetch(url, body, attempt + 1);
    }
    throw error;
  }
}

const mapCandidate = (item: any): OpenFigiCandidate | null => {
  const ticker = clean(item.ticker).toUpperCase();
  if (!ticker) return null;
  return {
    ticker,
    name: clean(item.name) || undefined,
    exchange: clean(item.exchCode) || undefined,
    security_type: clean(item.securityType) || undefined,
    security_type2: clean(item.securityType2) || undefined,
    market_sector: clean(item.marketSector) || undefined,
    figi: clean(item.figi) || undefined,
    composite_figi: clean(item.compositeFIGI) || undefined,
    share_class_figi: clean(item.shareClassFIGI) || undefined,
    security_description: clean(item.securityDescription) || undefined,
  };
};

const scoreCandidate = (candidate: OpenFigiCandidate, query: string) => {
  let score = 0;
  if (candidate.exchange === "US") score += 80;
  if (candidate.exchange?.startsWith("U")) score += 25;
  if (fundish(candidate)) score += 45;
  if (/ETP|ETF/i.test(candidate.security_type ?? "")) score += 20;
  if (/Mutual Fund|Fund/i.test(candidate.security_type2 ?? "")) score += 18;
  if (candidate.ticker === normalize(query)) score += 35;
  if (candidate.name?.toUpperCase() === normalize(query)) score += 25;
  if (candidate.market_sector === "Equity") score += 5;
  return score;
};

const dedupeAndRank = (items: OpenFigiCandidate[], query: string) => {
  const seen = new Set<string>();
  return items
    .filter((item) => fundish(item))
    .map((item) => ({ ...item, score: scoreCandidate(item, query) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .filter((item) => {
      const key = `${item.ticker}|${item.composite_figi ?? item.figi ?? ""}|${item.exchange ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => enrichIdentifiers(item, query))
    .slice(0, 8);
};

async function mappingResolve(query: string, idType: string) {
  const response = await openFigiFetch(OPENFIGI_MAPPING_URL, [{ idType, idValue: normalize(query) }]);
  if (!response.ok) throw new Error(`OpenFIGI mapping failed with HTTP ${response.status}.`);
  const payload = await response.json();
  const rows = (payload?.[0]?.data ?? []).map(mapCandidate).filter(Boolean) as OpenFigiCandidate[];
  return dedupeAndRank(rows, query);
}

async function searchResolve(query: string) {
  const response = await openFigiFetch(OPENFIGI_SEARCH_URL, { query });
  if (!response.ok) throw new Error(`OpenFIGI search failed with HTTP ${response.status}.`);
  const payload = await response.json();
  const rows = (payload?.data ?? []).map(mapCandidate).filter(Boolean) as OpenFigiCandidate[];
  return dedupeAndRank(rows, query);
}

export async function resolveInstrumentWithOpenFigi(queryInput: string) {
  const input = queryInput.trim();
  if (!input) throw new Error("Search query is required.");
  let candidates: OpenFigiCandidate[] = [];
  let resolutionType = "OpenFIGI";

  if (isIsin(input)) {
    candidates = await mappingResolve(input, "ID_ISIN");
    resolutionType = "OpenFIGI ISIN";
  } else if (isCusip(input) && !isTicker(input)) {
    candidates = await mappingResolve(input, "ID_CUSIP");
    resolutionType = "OpenFIGI CUSIP";
  } else if (isTicker(input)) {
    candidates = await mappingResolve(input, "TICKER");
    resolutionType = "OpenFIGI ticker";
  } else {
    candidates = await searchResolve(input);
    resolutionType = "OpenFIGI search";
  }

  if (!candidates.length) {
    throw new Error("No instrument found for this search. Try ticker, ISIN, CUSIP, or a more specific fund name.");
  }

  const best = candidates[0];
  const second = candidates[1];
  const confident = best.exchange === "US" || !second || (best.score ?? 0) - (second.score ?? 0) >= 25;

  if (!confident) {
    return { needsSelection: true, candidates: candidates.map((candidate) => enrichIdentifiers(candidate, input)), resolutionType };
  }

  return {
    needsSelection: false,
    candidates,
    resolved: {
      ...enrichIdentifiers(best, input),
      input,
      resolved_ticker: best.ticker,
      resolution_source: resolutionType,
    } as ResolvedInstrument,
  };
}

export const directTickerInstrument = (query: string, reason = "Direct ticker fallback"): ResolvedInstrument => enrichIdentifiers({
  input: query,
  resolved_ticker: normalize(query),
  ticker: normalize(query),
  name: normalize(query),
  resolution_source: reason,
}, query);
