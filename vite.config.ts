import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const requiredKeyFor = (pathname: string, env: Record<string, string>) => {
  if (pathname.startsWith("/api/fred")) return env.VITE_FRED_API_KEY ?? "";
  if (pathname.startsWith("/api/eia")) return env.VITE_EIA_API_KEY ?? "";
  return "";
};

const upstreamFor = (pathname: string) => {
  if (pathname.startsWith("/api/fred")) {
    return { baseUrl: "https://api.stlouisfed.org/fred", strippedPath: pathname.replace(/^\/api\/fred/, "") };
  }

  if (pathname.startsWith("/api/eia")) {
    return { baseUrl: "https://api.eia.gov", strippedPath: pathname.replace(/^\/api\/eia/, "") };
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
  const upstream = upstreamFor(parsedUrl.pathname);

  if (!upstream) {
    next();
    return;
  }

  const apiKey = requiredKeyFor(parsedUrl.pathname, env);
  if (!apiKey) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Missing API key for proxied request." }));
    return;
  }

  const targetUrl = new URL(`${upstream.baseUrl}${upstream.strippedPath}`);
  parsedUrl.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value));
  targetUrl.searchParams.set("api_key", apiKey);

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

  return {
    plugins: [react(), tailwindcss(), nscApiProxy(env)],
  };
});
