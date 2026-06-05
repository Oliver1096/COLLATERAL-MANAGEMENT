const OPENFIGI_MAPPING_URL = "https://api.openfigi.com/v3/mapping";
const OPENFIGI_SEARCH_URL = "https://api.openfigi.com/v3/search";
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
    return { needsSelection: true, candidates, resolutionType };
  }

  return {
    needsSelection: false,
    candidates,
    resolved: {
      ...best,
      input,
      resolved_ticker: best.ticker,
      resolution_source: resolutionType,
    } as ResolvedInstrument,
  };
}

export const directTickerInstrument = (query: string, reason = "Direct ticker fallback"): ResolvedInstrument => ({
  input: query,
  resolved_ticker: normalize(query),
  ticker: normalize(query),
  name: normalize(query),
  resolution_source: reason,
});
