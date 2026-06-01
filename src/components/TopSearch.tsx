import { Bell, Bookmark, Expand, Menu, Search } from "lucide-react";

export function TopSearch() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020706]/86 px-4 py-2 backdrop-blur-xl sm:px-5 lg:ml-56">
      <div className="mx-auto flex max-w-[1500px] items-center gap-4">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative mx-auto max-w-[640px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.035] pl-11 pr-12 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/40 focus:bg-white/[0.06]"
            placeholder="Buscar cualquier activo, indicador, país, tasa, commodity o fuente..."
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">⌘K</span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <button className="text-slate-400 transition hover:text-white"><Bell className="h-4 w-4" /></button>
          <button className="text-slate-400 transition hover:text-white"><Bookmark className="h-4 w-4" /></button>
          <button className="text-slate-400 transition hover:text-white"><Expand className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}
