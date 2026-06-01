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

      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">
        <div className="mx-auto max-w-[1600px] space-y-8">
          {error && (
            <div className="flex items-start gap-3 rounded-3xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Dashboard service error</p>
                <p className="mt-1 text-sm text-red-100/80">{error}</p>
              </div>
            </div>
          )}

          <Hero metrics={data.metrics} />
          <SnapshotGrid metrics={data.metrics} />
          <AssetClassGrid />

          <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
            <Watchlist />
            <MarketOverview />
          </div>

          <FeaturedInsights />

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <LatestUpdates updates={data.updates} />
            <SourceStatusList sources={data.sources} />
          </div>

          <MissingDataPanel />

          <footer className="pb-10 text-center text-xs text-slate-600">
            NSC Insights is an internal financial intelligence platform. Not for public distribution.
          </footer>
        </div>
      </main>
    </div>
  );
}
