import { ChevronDown } from "lucide-react";
import { navigationItems } from "../data/navigation";
import type { SourceHealth } from "../types/market";

interface SidebarProps {
  sources: SourceHealth[];
}

export function Sidebar({ sources }: SidebarProps) {
  const currentPath = window.location.pathname;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[188px] overflow-hidden border-r border-white/10 bg-[#020706]/96 shadow-[18px_0_70px_rgba(0,0,0,0.34)] backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-5 flex items-center gap-2 px-1">
          <div className="text-[24px] font-black leading-none tracking-[-0.09em] text-white">NSC</div>
          <div className="leading-[0.85]">
            <p className="text-[8px] font-black uppercase tracking-[0.19em] text-slate-200">Intelligence</p>
            <p className="text-[8px] font-black uppercase tracking-[0.19em] text-slate-200">Hub</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href);

            return (
              <a
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium transition ${
                  active
                    ? "border border-emerald-400/20 bg-emerald-400/10 text-white shadow-[0_0_22px_rgba(37,211,102,0.08)]"
                    : "text-slate-400 hover:bg-white/[0.045] hover:text-slate-100"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-emerald-300" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold text-slate-300">Fuentes Conectadas</p>
            <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-emerald-300">Ver todo</span>
          </div>
          <div className="space-y-2">
            {sources.length === 0
              ? Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-5 animate-pulse rounded bg-white/[0.04]" />)
              : sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between gap-2 px-1 text-[9.5px]">
                    <span className="flex min-w-0 items-center gap-2 text-slate-300">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${source.status === "online" ? "bg-emerald-400 shadow-[0_0_10px_rgba(37,211,102,0.85)]" : source.status === "missing-key" ? "bg-amber-300" : "bg-red-400"}`} />
                      <span className="truncate">{source.name}</span>
                    </span>
                    <span className={source.status === "online" ? "text-emerald-300" : "text-amber-200"}>
                      {source.status === "online" ? "En vivo" : source.status === "missing-key" ? "Key" : "Error"}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-slate-200">NS</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold text-white">Usuario NSC</p>
              <p className="truncate text-[9px] text-slate-500">Analista</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}
