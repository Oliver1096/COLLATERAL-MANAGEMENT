import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { scanSecHoldings } from "./src/server/secScanner";
import { directTickerInstrument, resolveInstrumentWithOpenFigi } from "./src/server/openFigiResolver";

const requiresApiKey = (pathname: string) =>
  pathname.startsWith("/api/fred") || pathname.startsWith("/api/eia") || pathname.startsWith("/api/banxico");

const requiredKeyFor = (pathname: string, env: Record<string, string>) => {
  if (pathname.startsWith("/api/fred")) return env.VITE_FRED_API_KEY ?? "";
  if (pathname.startsWith("/api/eia")) return env.VITE_EIA_API_KEY ?? "";
  if (pathname.startsWith("/api/banxico")) return env.VITE_BANXICO_TOKEN ?? "";
  return "";
};

const upstreamFor = (pathname: string) => {
  if (pathname.startsWith("/api/fred")) {
    return { baseUrl: "https://api.stlouisfed.org/fred", strippedPath: pathname.replace(/^\/api\/fred/, "") };
  }

  if (pathname.startsWith("/api/eia")) {
    return { baseUrl: "https://api.eia.gov", strippedPath: pathname.replace(/^\/api\/eia/, "") };
  }

  if (pathname.startsWith("/api/banxico")) {
    return { baseUrl: "https://www.banxico.org.mx", strippedPath: pathname.replace(/^\/api\/banxico/, "") };
  }

  if (pathname.startsWith("/api/boj")) {
    return { baseUrl: "https://www.stat-search.boj.or.jp", strippedPath: pathname.replace(/^\/api\/boj/, "") };
  }

  return null;
};

const createApiProxyMiddleware = (env: Record<string, string>) => async (
  req: { url?: string },
  res: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body?: string) => void;
  },
  next: () => void,
) => {
  const incomingUrl = req.url ?? "";
  const parsedUrl = new URL(incomingUrl, "http://nsc.local");

  if (parsedUrl.pathname === "/api/scanner/sec-holdings") {
    const query = parsedUrl.searchParams.get("query") ?? parsedUrl.searchParams.get("ticker") ?? "";
    const directTicker = parsedUrl.searchParams.get("ticker");
    try {
      let resolvedInstrument = directTicker ? directTickerInstrument(directTicker, "Selected ticker") : null;
      let openFigiCandidates: unknown[] = [];

      if (!resolvedInstrument) {
        try {
          const resolution = await resolveInstrumentWithOpenFigi(query);
          openFigiCandidates = resolution.candidates ?? [];
          if (resolution.needsSelection) {
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.setHeader("cache-control", "no-store");
            res.end(JSON.stringify({ success: false, needs_selection: true, candidates: resolution.candidates }));
            return;
          }
          resolvedInstrument = resolution.resolved ?? null;
        } catch (openFigiError) {
          if (/^[A-Za-z0-9.\-]{1,12}$/.test(query.trim())) {
            resolvedInstrument = directTickerInstrument(query, "Direct ticker fallback after OpenFIGI failure");
          } else {
            throw openFigiError;
          }
        }
      }

      const result = await scanSecHoldings(resolvedInstrument?.resolved_ticker ?? query);
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.setHeader("cache-control", "no-store");
      res.end(JSON.stringify({
        ...result,
        query,
        resolved_instrument: resolvedInstrument,
        debug: {
          ...(result.debug ?? {}),
          openfigi_candidates: openFigiCandidates,
        },
      }));
    } catch (error) {
      let message = error instanceof Error ? error.message : "Unknown SEC scanner error.";
      if (message.includes("No SEC fund mapping")) {
        message = "Instrument identified by OpenFIGI, but it does not appear to be a supported US SEC-reporting fund/ETF. This scanner currently supports US funds with SEC NPORT-P filings.";
      }
      res.statusCode = message.includes("No instrument found") ? 404 : message.includes("supported US SEC-reporting") ? 422 : 500;
      res.setHeader("content-type", "application/json");
      res.setHeader("cache-control", "no-store");
      res.end(JSON.stringify({ success: false, error: message, debug: { skipped_filings: (error as { skipped?: unknown[] })?.skipped ?? [] } }));
    }
    return;
  }

  const upstream = upstreamFor(parsedUrl.pathname);

  if (!upstream) {
    next();
    return;
  }

  const apiKey = requiredKeyFor(parsedUrl.pathname, env);
  if (requiresApiKey(parsedUrl.pathname) && !apiKey) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Missing API key for proxied request." }));
    return;
  }

  const targetUrl = new URL(`${upstream.baseUrl}${upstream.strippedPath}`);
  parsedUrl.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value));
  if (parsedUrl.pathname.startsWith("/api/banxico")) {
    targetUrl.searchParams.set("token", apiKey);
  } else if (apiKey) {
    targetUrl.searchParams.set("api_key", apiKey);
  }

  try {
    const upstreamResponse = await fetch(targetUrl);
    const body = await upstreamResponse.text();

    res.statusCode = upstreamResponse.status;
    res.setHeader("content-type", upstreamResponse.headers.get("content-type") ?? "application/json");
    res.setHeader("cache-control", "public, max-age=300");
    res.end(body);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown proxy error.",
      }),
    );
  }
};

const nscApiProxy = (env: Record<string, string>): Plugin => ({
  name: "nsc-api-proxy",
  configureServer(server) {
    server.middlewares.use(createApiProxyMiddleware(env));
  },
  configurePreviewServer(server) {
    server.middlewares.use(createApiProxyMiddleware(env));
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), nscApiProxy(env)],
  };
});
