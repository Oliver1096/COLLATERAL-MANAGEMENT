import { Bell, Bookmark, Menu, MoreVertical, Search } from "lucide-react";

export function TopSearch() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020706]/82 px-3 py-2 backdrop-blur-2xl sm:px-4 lg:ml-[188px]">
      <div className="mx-auto flex max-w-[1360px] items-center gap-4">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative mx-auto max-w-[520px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            className="h-9 w-full rounded-lg border border-white/10 bg-black/30 pl-10 pr-12 text-[11px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_14px_40px_rgba(0,0,0,0.24)] outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 focus:bg-white/[0.045] focus:shadow-[0_0_0_3px_rgba(37,211,102,0.08)]"
            placeholder="Buscar cualquier activo, indicador, país, tasa, commodity o fuente..."
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/[0.045] px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">⌘ K</span>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button className="text-slate-400 transition hover:text-white"><Bell className="h-4 w-4" /></button>
          <button className="text-slate-400 transition hover:text-white"><Bookmark className="h-4 w-4" /></button>
          <button className="text-slate-400 transition hover:text-white"><MoreVertical className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}
