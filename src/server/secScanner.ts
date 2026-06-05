import { XMLParser } from "fast-xml-parser";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const SEC_BASE = "https://www.sec.gov";
const SEC_DATA = "https://data.sec.gov";
const FALLBACK_PATH = path.resolve(process.cwd(), "server/data/manual_fund_fallbacks.csv");
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const DEFAULT_USER_AGENT = "NSC Insights contact@example.com";
const REQUEST_DELAY_MS = 140;

interface FundMapping {
  symbol: string;
  name: string;
  cik: string;
  seriesId?: string | null;
  classId?: string | null;
  use_latest_nport?: boolean;
  source: string;
}

interface FilingCandidate {
  accession: string;
  accessionNoDashes: string;
  filingDate?: string;
  reportDate?: string;
  primaryDocument?: string;
  form?: string;
  source: "recent" | "historical";
}

interface XmlMetadata {
  registrant_name?: string | null;
  regCik?: string | null;
  seriesName?: string | null;
  seriesId?: string | null;
  classId?: string | null;
  reportPeriod?: string | null;
  netAssets?: number | null;
  totalAssets?: number | null;
  totalLiabilities?: number | null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const cleaned = clean(item);
      if (cleaned) return cleaned;
    }
    return null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = clean(record["#text"] ?? record["@_value"] ?? record.value ?? record._text);
    if (direct) return direct;
    const primitiveChild = Object.entries(record)
      .filter(([key]) => !key.startsWith("@_"))
      .map(([, child]) => clean(child))
      .find(Boolean);
    return primitiveChild ?? null;
  }
  const text = String(value).trim();
  return text && text !== "[object Object]" ? text : null;
};
const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase();
const normalizeCik = (cik: string | number) => String(cik).replace(/\D/g, "").padStart(10, "0");
const accessionNoDashes = (accession: string) => accession.replace(/-/g, "");
const toNumber = (value: unknown) => {
  const text = clean(value);
  if (!text || text === "N/A") return null;
  const numeric = Number(text.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};
const asArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};
const local = (key: string) => key.includes(":") ? key.split(":").pop() ?? key : key;

const findDeepValues = (node: unknown, wanted: string, results: unknown[] = []): unknown[] => {
  if (!node || typeof node !== "object") return results;
  if (Array.isArray(node)) {
    node.forEach((item) => findDeepValues(item, wanted, results));
    return results;
  }
  Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
    if (local(key) === wanted) results.push(value);
    findDeepValues(value, wanted, results);
  });
  return results;
};
const firstText = (node: unknown, names: string[]) => {
  for (const name of names) {
    const value = findDeepValues(node, name).map(clean).find(Boolean);
    if (value) return value;
  }
  return null;
};

async function secFetch(url: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const userAgent = process.env.SEC_USER_AGENT || DEFAULT_USER_AGENT;
  await sleep(REQUEST_DELAY_MS);
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": userAgent,
        "Accept-Encoding": "gzip, deflate",
        Accept: "application/json, text/xml, application/xml, text/plain, */*",
        ...(init.headers ?? {}),
      },
    });
    if (RETRY_STATUSES.has(response.status) && attempt < 3) {
      await sleep(400 * 2 ** attempt);
      return secFetch(url, init, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt < 3) {
      await sleep(400 * 2 ** attempt);
      return secFetch(url, init, attempt + 1);
    }
    throw error;
  }
}
async function secJson<T>(url: string): Promise<T> {
  const response = await secFetch(url);
  if (!response.ok) throw new Error(`SEC request failed ${response.status}: ${url}`);
  return response.json() as Promise<T>;
}
async function secText(url: string): Promise<string> {
  const response = await secFetch(url, { headers: { Accept: "application/xml, text/xml, text/plain, */*" } });
  if (!response.ok) throw new Error(`SEC XML request failed ${response.status}: ${url}`);
  return response.text();
}

function parseCsvLine(line: string): string[] {
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
}
function readFallbacks(): FundMapping[] {
  if (!existsSync(FALLBACK_PATH)) return [];
  const lines = readFileSync(FALLBACK_PATH, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, index) => { row[key] = values[index] ?? ""; });
    return {
      symbol: normalizeTicker(row.symbol ?? ""),
      name: row.name ?? "",
      cik: normalizeCik(row.cik ?? ""),
      seriesId: clean(row.seriesId),
      classId: clean(row.classId),
      use_latest_nport: String(row.use_latest_nport ?? "").toUpperCase() === "TRUE",
      source: "manual_fund_fallbacks.csv",
    };
  }).filter((row) => row.symbol && row.cik);
}

async function lookupFund(ticker: string): Promise<FundMapping> {
  const symbol = normalizeTicker(ticker);
  const mapping = await secJson<any>(`${SEC_BASE}/files/company_tickers_mf.json`);
  const secRows = Array.isArray(mapping?.data)
    ? mapping.data.map((row: unknown[]) => {
        const item: Record<string, unknown> = {};
        (mapping.fields ?? []).forEach((field: string, index: number) => {
          item[field] = row[index];
        });
        return item;
      })
    : Array.isArray(mapping)
      ? mapping
      : Object.values(mapping ?? {});

  for (const item of secRows) {
    const secSymbol = normalizeTicker(item.ticker ?? item.symbol ?? "");
    if (secSymbol === symbol) {
      return {
        symbol,
        name: clean(item.title) ?? clean(item.name) ?? symbol,
        cik: normalizeCik(item.cik_str ?? item.cik ?? item.cikStr ?? ""),
        seriesId: clean(item.seriesId ?? item.series_id),
        classId: clean(item.classId ?? item.class_id),
        use_latest_nport: false,
        source: "company_tickers_mf.json",
      };
    }
  }
  const fallback = readFallbacks().find((row) => row.symbol === symbol);
  if (fallback) return fallback;
  throw new Error("No SEC fund mapping found for this ticker. Add it to manual_fund_fallbacks.csv with its CIK.");
}

function recentFilings(submissions: any): FilingCandidate[] {
  const recent = submissions?.filings?.recent ?? {};
  const forms = recent.form ?? [];
  const accessions = recent.accessionNumber ?? [];
  const filingDates = recent.filingDate ?? [];
  const reportDates = recent.reportDate ?? [];
  const primaryDocs = recent.primaryDocument ?? [];
  const out: FilingCandidate[] = [];
  for (let i = 0; i < forms.length; i += 1) {
    if (forms[i] === "NPORT-P" && accessions[i]) {
      out.push({
        form: forms[i],
        accession: accessions[i],
        accessionNoDashes: accessionNoDashes(accessions[i]),
        filingDate: filingDates[i],
        reportDate: reportDates[i],
        primaryDocument: primaryDocs[i],
        source: "recent",
      });
    }
  }
  return out;
}
async function historicalFilings(submissions: any): Promise<FilingCandidate[]> {
  const files = submissions?.filings?.files ?? [];
  const all: FilingCandidate[] = [];
  for (const file of files.slice(0, 12)) {
    if (!file.name) continue;
    const data = await secJson<any>(`${SEC_DATA}/submissions/${file.name}`);
    all.push(...recentFilings({ filings: { recent: data } }).map((item) => ({ ...item, source: "historical" as const })));
  }
  return all;
}
function xmlUrls(cik: string, filing: FilingCandidate) {
  const base = `${SEC_BASE}/Archives/edgar/data/${Number(cik)}/${filing.accessionNoDashes}`;
  const urls = [];
  if (filing.primaryDocument) urls.push(`${base}/${filing.primaryDocument}`);
  urls.push(`${base}/primary_doc.xml`);
  return [...new Set(urls)];
}

function parseXml(xml: string) {
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, trimValues: true });
  return parser.parse(xml);
}
function extractMetadata(parsed: any): XmlMetadata {
  const metadata: XmlMetadata = {
    registrant_name: firstText(parsed, ["regName", "registrantName", "name"]),
    regCik: firstText(parsed, ["regCik", "cik"]),
    seriesName: firstText(parsed, ["seriesName"]),
    seriesId: firstText(parsed, ["seriesId"]),
    classId: firstText(parsed, ["classId"]),
    reportPeriod: firstText(parsed, ["repPdDate", "reportPeriodDate", "reportDate"]),
    netAssets: toNumber(firstText(parsed, ["netAssets"])),
    totalAssets: toNumber(firstText(parsed, ["totAssets", "totalAssets"])),
    totalLiabilities: toNumber(firstText(parsed, ["totLiabs", "totalLiabilities"])),
  };
  return metadata;
}
function matchesFund(metadata: XmlMetadata, fund: FundMapping) {
  const expectedSeries = clean(fund.seriesId);
  const expectedClass = clean(fund.classId);
  if (fund.use_latest_nport && !expectedSeries && !expectedClass) return { ok: true, reason: "manual fallback use_latest_nport" };
  if (expectedSeries && metadata.seriesId && expectedSeries === metadata.seriesId) {
    if (!expectedClass || !metadata.classId || expectedClass === metadata.classId) return { ok: true, reason: "series/class match" };
  }
  if (!expectedSeries && normalizeCik(metadata.regCik ?? fund.cik) === normalizeCik(fund.cik)) return { ok: true, reason: "CIK metadata match" };
  return { ok: false, reason: `metadata mismatch series=${metadata.seriesId ?? "n/a"} class=${metadata.classId ?? "n/a"}` };
}
function invstNodes(parsed: any) {
  return findDeepValues(parsed, "invstOrSec").flatMap((item) => asArray(item as any));
}
function getField(node: any, names: string[]) { return firstText(node, names); }
function parseHolding(node: any, netAssets: number | null) {
  const marketValue = toNumber(getField(node, ["valUSD", "valueUSD", "marketValue", "market_value_usd"]));
  const weight = netAssets && marketValue !== null ? (marketValue / netAssets) * 100 : toNumber(getField(node, ["pctVal", "weightPct", "weight_pct"]));
  return {
    name: getField(node, ["name", "issuerName"]) ?? "Unknown",
    title: getField(node, ["title", "titleOfClass"]) ?? getField(node, ["name"]),
    lei: getField(node, ["lei"]),
    cusip: getField(node, ["cusip"]),
    isin: getField(node, ["isin"]),
    balance: toNumber(getField(node, ["balance", "bal"])),
    units: getField(node, ["units"]),
    currency: getField(node, ["curCd", "currency", "currencyCode"]),
    market_value_usd: marketValue,
    weight_pct: weight,
    payoff_profile: getField(node, ["payoffProfile", "payoff_profile"]),
    asset_category: getField(node, ["assetCat", "assetCategory"]),
    issuer_category: getField(node, ["issuerCat", "issuerCategory"]),
    country: getField(node, ["invCountry", "country"]),
    is_restricted: getField(node, ["isRestrictedSec", "isRestricted", "restricted"]),
    fair_value_level: getField(node, ["fairValLevel", "fairValueLevel"]),
  };
}

export async function scanSecHoldings(tickerInput: string) {
  const ticker = normalizeTicker(tickerInput);
  if (!/^[A-Z0-9.\-]{1,12}$/.test(ticker)) throw new Error("Ticker inválido. Usa solo tickers US de fondo/ETF.");
  const fund = await lookupFund(ticker);
  const cik = normalizeCik(fund.cik);
  const submissions = await secJson<any>(`${SEC_DATA}/submissions/CIK${cik}.json`);
  const skipped: any[] = [];
  const candidates = recentFilings(submissions);
  candidates.push(...await historicalFilings(submissions));

  for (const filing of candidates.slice(0, 120)) {
    for (const xmlUrl of xmlUrls(cik, filing)) {
      try {
        const xml = await secText(xmlUrl);
        const parsed = parseXml(xml);
        const metadata = extractMetadata(parsed);
        const match = matchesFund(metadata, fund);
        if (!match.ok) {
          skipped.push({ accession: filing.accession, filing_date: filing.filingDate, report_date: filing.reportDate, xml_url: xmlUrl, reason: match.reason });
          continue;
        }
        const holdings = invstNodes(parsed).map((node) => parseHolding(node, metadata.netAssets ?? null));
        if (!holdings.length) throw new Error("XML was downloaded and matched, but no <invstOrSec> holdings were found.");
        holdings.sort((a, b) => (b.weight_pct ?? -Infinity) - (a.weight_pct ?? -Infinity));
        const totalWeight = holdings.reduce((sum, item) => sum + (item.weight_pct ?? 0), 0);
        const totalMarketValue = holdings.reduce((sum, item) => sum + (item.market_value_usd ?? 0), 0);
        return {
          success: true,
          ticker,
          fund: {
            symbol: fund.symbol,
            name: fund.name,
            registrant_name: metadata.registrant_name,
            series_name: metadata.seriesName,
            cik,
            series_id: fund.seriesId ?? metadata.seriesId ?? null,
            class_id: fund.classId ?? metadata.classId ?? null,
            accession: filing.accession,
            filing_date: filing.filingDate,
            report_period: filing.reportDate ?? metadata.reportPeriod,
            xml_report_period: metadata.reportPeriod,
            xml_url: xmlUrl,
          },
          quality_check: {
            holdings_count: holdings.length,
            total_weight_pct: Number(totalWeight.toFixed(6)),
            total_market_value_usd: totalMarketValue,
            top_holding: holdings[0]?.name ?? null,
            net_assets: metadata.netAssets,
            total_assets: metadata.totalAssets,
            total_liabilities: metadata.totalLiabilities,
          },
          holdings,
          debug: { match_reason: match.reason, skipped_filings: skipped },
        };
      } catch (error) {
        skipped.push({ accession: filing.accession, filing_date: filing.filingDate, report_date: filing.reportDate, xml_url: xmlUrl, reason: error instanceof Error ? error.message : "Unknown XML error" });
      }
    }
  }
  throw Object.assign(new Error("Could not find a matching/valid NPORT-P."), { skipped });
}
