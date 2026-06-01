import { ChevronRight } from "lucide-react";
import { navigationItems } from "../data/navigation";
import type { SourceHealth } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface SidebarProps {
  sources: SourceHealth[];
}

export function Sidebar({ sources }: SidebarProps) {
  return (
    <aside className="glass-panel fixed inset-y-0 left-0 z-40 hidden w-72 overflow-y-auto border-r border-white/10 px-4 py-5 lg:block">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-lg font-black text-emerald-200 green-glow">
          NSC
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200">Insights</p>
          <p className="text-xs text-slate-400">Internal Intelligence</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;

          return (
            <a
              key={item.label}
              href={item.href}
              className={`group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition ${
                active
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${active ? "text-emerald-300" : "text-slate-500"}`} />
                {item.label}
              </span>
              {active && <ChevronRight className="h-4 w-4 text-emerald-300" />}
            </a>
          );
        })}
      </nav>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black/25 p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fuentes Conectadas</p>
          <p className="mt-1 text-sm text-slate-300">Estado en vivo de APIs</p>
        </div>
        <div className="space-y-3">
          {sources.length === 0
            ? Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-2xl bg-white/[0.04]" />
              ))
            : sources.map((source) => (
                <div key={source.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{source.name}</p>
                    <StatusBadge status={source.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{source.error ?? source.lastUpdated}</p>
                </div>
              ))}
        </div>
      </div>
    </aside>
  );
}
