import { ChevronDown } from "lucide-react";
import { navigationItems } from "../data/navigation";
import type { SourceHealth } from "../types/market";
import { StatusBadge } from "./StatusBadge";

interface SidebarProps {
  sources: SourceHealth[];
}

export function Sidebar({ sources }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-36 overflow-y-auto border-r border-white/10 bg-[#020706]/95 px-2 py-3 lg:block">
      <div className="mb-5 flex items-center gap-1.5 px-1">
        <div className="text-[22px] font-black tracking-[-0.08em] text-white">NSC</div>
        <div className="leading-none">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">Intelligence</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">Hub</p>
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
              className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-[10px] transition ${
                active ? "bg-white/[0.075] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? "text-emerald-300" : "text-slate-500"}`} />
              <span className="truncate">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="px-1 text-[10px] font-semibold text-slate-300">Fuentes Conectadas</p>
        <p className="mt-1 px-1 text-[9px] text-emerald-300">Todos los sistemas operativos</p>
        <div className="mt-3 space-y-2">
          {sources.length === 0
            ? Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-5 animate-pulse rounded bg-white/[0.04]" />)
            : sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between gap-1.5 px-1 text-[9.5px]">
                  <span className="flex min-w-0 items-center gap-2 text-slate-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${source.status === "online" ? "bg-emerald-400" : source.status === "missing-key" ? "bg-amber-300" : "bg-red-400"}`} />
                    <span className="truncate">{source.name}</span>
                  </span>
                  <span className={source.status === "online" ? "text-emerald-300" : "text-amber-200"}>
                    {source.status === "online" ? "En línea" : source.status === "missing-key" ? "Missing key" : "Error"}
                  </span>
                </div>
              ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#020706] p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-slate-300">NS</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-white">Usuario NSC</p>
            <p className="truncate text-[10px] text-slate-500">Administrador</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
