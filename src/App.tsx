import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, EyeOff, RotateCcw, SlidersHorizontal } from "lucide-react";
import { AssetClassGrid } from "./components/AssetClassGrid";
import { FeaturedInsights } from "./components/FeaturedInsights";
import { Hero } from "./components/Hero";
import { FredDataPanel } from "./components/FredDataPanel";
import { FixedIncomePage } from "./components/fixedIncome/FixedIncomePage";
import { LatestUpdates } from "./components/LatestUpdates";
import { MarketOverview } from "./components/MarketOverview";
import { MissingDataPanel } from "./components/MissingDataPanel";
import { Sidebar } from "./components/Sidebar";
import { ScannerPage } from "./components/ScannerPage";
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
  { id: "boe", name: "BoE via FRED", status: "online", description: "SONIA overnight rate." },
  { id: "boj", name: "BOJ", status: "online", description: "Japan TONA official rate." },
];

const scannerSidebarSources: SourceHealth[] = [
  { id: "sec", name: "SEC EDGAR", status: "online", description: "NPORT-P holdings parser." },
];

const defaultDashboardOrder = ["hero", "snapshot", "fred", "workspace", "insights", "sources", "missing"];
const dashboardStorageKey = "nsc-insights-dashboard-layout-v1";

interface DashboardLayoutState {
  order: string[];
  hidden: string[];
}

function loadDashboardLayout(): DashboardLayoutState {
  if (typeof window === "undefined") return { order: defaultDashboardOrder, hidden: [] };
  try {
    const stored = window.localStorage.getItem(dashboardStorageKey);
    if (!stored) return { order: defaultDashboardOrder, hidden: [] };
    const parsed = JSON.parse(stored) as Partial<DashboardLayoutState>;
    const savedOrder = Array.isArray(parsed.order) ? parsed.order : [];
    const order = [...savedOrder.filter((id) => defaultDashboardOrder.includes(id)), ...defaultDashboardOrder.filter((id) => !savedOrder.includes(id))];
    const hidden = Array.isArray(parsed.hidden) ? parsed.hidden.filter((id) => defaultDashboardOrder.includes(id)) : [];
    return { order, hidden };
  } catch {
    return { order: defaultDashboardOrder, hidden: [] };
  }
}

function DashboardSection({
  id,
  title,
  index,
  total,
  onMove,
  onHide,
  children,
}: {
  id: string;
  title: string;
  index: number;
  total: number;
  onMove: (id: string, direction: -1 | 1) => void;
  onHide: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
        <div className="flex items-center gap-1.5">
          <button className="minimal-control-button rounded-lg p-1.5 disabled:opacity-30" disabled={index === 0} onClick={() => onMove(id, -1)} title="Mover arriba">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button className="minimal-control-button rounded-lg p-1.5 disabled:opacity-30" disabled={index === total - 1} onClick={() => onMove(id, 1)} title="Mover abajo">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button className="minimal-control-button rounded-lg p-1.5" onClick={() => onHide(id)} title="Ocultar bloque">
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const currentPath = window.location.pathname;
  const isFixedIncomePage = currentPath === "/renta-fija";
  const isScannerPage = currentPath === "/scanner";
  const { data, error } = useDashboardData({ enabled: !isFixedIncomePage && !isScannerPage });
  const [layout, setLayout] = useState<DashboardLayoutState>(() => loadDashboardLayout());
  const sidebarSources = isFixedIncomePage
    ? fixedIncomeSidebarSources
    : isScannerPage
      ? scannerSidebarSources
      : data.sources;

  useEffect(() => {
    window.localStorage.setItem(dashboardStorageKey, JSON.stringify(layout));
  }, [layout]);

  const moveSection = (id: string, direction: -1 | 1) => {
    setLayout((current) => {
      const index = current.order.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.order.length) return current;
      const order = [...current.order];
      [order[index], order[target]] = [order[target], order[index]];
      return { ...current, order };
    });
  };

  const hideSection = (id: string) => {
    setLayout((current) => ({ ...current, hidden: [...new Set([...current.hidden, id])] }));
  };

  const resetLayout = () => setLayout({ order: defaultDashboardOrder, hidden: [] });

  const dashboardSections = useMemo(
    () => ({
      hero: { title: "Inicio", content: <Hero metrics={data.metrics} /> },
      snapshot: { title: "Market snapshot", content: <SnapshotGrid metrics={data.metrics} /> },
      fred: { title: "FRED data", content: <FredDataPanel metrics={data.fredMetrics} /> },
      workspace: {
        title: "Workspace",
        content: (
          <div className="grid gap-3.5 xl:grid-cols-[0.9fr_1.1fr_1.55fr]">
            <AssetClassGrid />
            <Watchlist />
            <MarketOverview />
          </div>
        ),
      },
      insights: {
        title: "Insights y actualizaciones",
        content: (
          <div className="grid gap-3.5 xl:grid-cols-[1.12fr_1fr]">
            <FeaturedInsights />
            <LatestUpdates updates={data.updates} />
          </div>
        ),
      },
      sources: { title: "Fuentes", content: <SourceStatusList sources={data.sources} /> },
      missing: { title: "Datos pendientes", content: <MissingDataPanel /> },
    }),
    [data],
  );

  const visibleOrder = layout.order.filter((id) => !layout.hidden.includes(id));

  return (
    <div className="dashboard-bg min-h-screen text-slate-100">
      <Sidebar sources={sidebarSources} />
      <TopSearch />

      <main className="px-3 pb-8 pt-3 sm:px-4 lg:ml-[188px]">
        <div className="mx-auto max-w-[1360px] space-y-4">
          {error && (
            <div className="premium-panel flex items-start gap-3 rounded-2xl border-red-400/25 bg-red-500/10 p-4 text-red-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Dashboard service error</p>
                <p className="mt-1 text-sm text-red-100/80">{error}</p>
              </div>
            </div>
          )}

          {isScannerPage ? (
            <ScannerPage />
          ) : isFixedIncomePage ? (
            <FixedIncomePage />
          ) : (
            <>
              <div className="premium-panel flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <SlidersHorizontal className="h-4 w-4 text-[#7f9b8b]" />
                  <span>Personaliza tu dashboard: mueve u oculta bloques. Se guarda solo para este navegador.</span>
                </div>
                <button className="minimal-control-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold" onClick={resetLayout}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurar dashboard
                </button>
              </div>

              {visibleOrder.length === 0 ? (
                <div className="premium-panel rounded-[1.25rem] p-6 text-sm text-slate-400">
                  Todos los bloques están ocultos. Usa “Restaurar dashboard” para recuperarlos.
                </div>
              ) : (
                visibleOrder.map((id, index) => {
                  const section = dashboardSections[id as keyof typeof dashboardSections];
                  return (
                    <DashboardSection key={id} id={id} title={section.title} index={index} total={visibleOrder.length} onMove={moveSection} onHide={hideSection}>
                      {section.content}
                    </DashboardSection>
                  );
                })
              )}
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
