import { AlertCircle } from "lucide-react";
import { AssetClassGrid } from "./components/AssetClassGrid";
import { FeaturedInsights } from "./components/FeaturedInsights";
import { Hero } from "./components/Hero";
import { FredDataPanel } from "./components/FredDataPanel";
import { FixedIncomePage } from "./components/fixedIncome/FixedIncomePage";
import { LatestUpdates } from "./components/LatestUpdates";
import { MarketOverview } from "./components/MarketOverview";
import { MissingDataPanel } from "./components/MissingDataPanel";
import { Sidebar } from "./components/Sidebar";
import { SnapshotGrid } from "./components/SnapshotGrid";
import { SourceStatusList } from "./components/SourceStatusList";
import { TopSearch } from "./components/TopSearch";
import { Watchlist } from "./components/Watchlist";
import { useDashboardData } from "./hooks/useDashboardData";
import type { SourceHealth } from "./types/market";

const fixedIncomeSidebarSources: SourceHealth[] = [
  { id: "fred", name: "FRED", status: "online", description: "U.S. Treasury and market rates." },
  { id: "ny-fed", name: "NY Fed", status: "online", description: "SOFR and money-market rates." },
  { id: "banxico", name: "Banxico", status: "missing-key", description: "TIIE Fondeo 1D requires VITE_BANXICO_TOKEN." },
  { id: "bcb", name: "BCB", status: "online", description: "Brazil CDI and SELIC daily series." },
  { id: "boj", name: "BOJ", status: "online", description: "Japan TONA official rate." },
];

export default function App() {
  const currentPath = window.location.pathname;
  const isFixedIncomePage = currentPath === "/renta-fija";
  const { data, error } = useDashboardData({ enabled: !isFixedIncomePage });
  const sidebarSources = isFixedIncomePage ? fixedIncomeSidebarSources : data.sources;

  return (
    <div className="dashboard-bg min-h-screen text-slate-100">
      <Sidebar sources={sidebarSources} />
      <TopSearch />

      <main className="px-3 pb-8 pt-3 sm:px-4 lg:ml-[188px]">
        <div className="mx-auto max-w-[1360px] space-y-3.5">
          {error && (
            <div className="premium-panel flex items-start gap-3 rounded-2xl border-red-400/25 bg-red-500/10 p-4 text-red-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Dashboard service error</p>
                <p className="mt-1 text-sm text-red-100/80">{error}</p>
              </div>
            </div>
          )}

          {isFixedIncomePage ? (
            <FixedIncomePage />
          ) : (
            <>
              <Hero metrics={data.metrics} />
              <SnapshotGrid metrics={data.metrics} />
              <FredDataPanel metrics={data.fredMetrics} />

              <div className="grid gap-3.5 xl:grid-cols-[0.9fr_1.1fr_1.55fr]">
                <AssetClassGrid />
                <Watchlist />
                <MarketOverview />
              </div>

              <div className="grid gap-3.5 xl:grid-cols-[1.12fr_1fr]">
                <FeaturedInsights />
                <LatestUpdates updates={data.updates} />
              </div>

              <SourceStatusList sources={data.sources} />
              <MissingDataPanel />
            </>
          )}

          <footer className="pb-7 pt-1 text-center text-[11px] text-slate-600">
            NSC Insights is an internal financial intelligence platform. Not for public distribution.
          </footer>
        </div>
      </main>
    </div>
  );
}
