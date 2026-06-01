import { AlertCircle } from "lucide-react";
import { AssetClassGrid } from "./components/AssetClassGrid";
import { FeaturedInsights } from "./components/FeaturedInsights";
import { Hero } from "./components/Hero";
import { LatestUpdates } from "./components/LatestUpdates";
import { MarketOverview } from "./components/MarketOverview";
import { MissingDataPanel } from "./components/MissingDataPanel";
import { Sidebar } from "./components/Sidebar";
import { SnapshotGrid } from "./components/SnapshotGrid";
import { SourceStatusList } from "./components/SourceStatusList";
import { TopSearch } from "./components/TopSearch";
import { Watchlist } from "./components/Watchlist";
import { useDashboardData } from "./hooks/useDashboardData";

export default function App() {
  const { data, error } = useDashboardData();

  return (
    <div className="min-h-screen text-slate-100">
      <Sidebar sources={data.sources} />
      <TopSearch />

      <main className="px-3 py-3 sm:px-5 lg:ml-56">
        <div className="mx-auto max-w-[1500px] space-y-3">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Dashboard service error</p>
                <p className="mt-1 text-sm text-red-100/80">{error}</p>
              </div>
            </div>
          )}

          <Hero metrics={data.metrics} />
          <SnapshotGrid metrics={data.metrics} />

          <div className="grid gap-3 xl:grid-cols-[0.88fr_1fr_1.72fr]">
            <AssetClassGrid />
            <Watchlist />
            <MarketOverview />
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.25fr_1fr]">
            <FeaturedInsights />
            <LatestUpdates updates={data.updates} />
          </div>

          <SourceStatusList sources={data.sources} />
          <MissingDataPanel />

          <footer className="pb-8 pt-2 text-center text-[11px] text-slate-600">
            NSC Insights is an internal financial intelligence platform. Not for public distribution.
          </footer>
        </div>
      </main>
    </div>
  );
}
