import { Bell, Menu, Search, ShieldCheck } from "lucide-react";

export function TopSearch() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#030604]/78 px-4 py-4 backdrop-blur-xl sm:px-6 lg:ml-72 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4">
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/40 focus:bg-white/[0.07]"
            placeholder="Buscar cualquier activo, indicador, país, tasa, commodity o fuente..."
          />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Private
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span className="text-sm text-slate-300">NSC Secure</span>
          </div>
        </div>
      </div>
    </header>
  );
}
