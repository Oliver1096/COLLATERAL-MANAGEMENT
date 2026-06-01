import { AlertTriangle } from "lucide-react";
import { missingDataItems } from "../data/missingData";

const priorityClasses = {
  Alta: "bg-red-500/10 text-red-200 border-red-400/25",
  Media: "bg-amber-400/10 text-amber-100 border-amber-300/25",
  Baja: "bg-slate-400/10 text-slate-200 border-slate-300/20",
};

const statusClasses = {
  Missing: "border-red-400/20 bg-red-500/10 text-red-200",
  Partial: "border-lime-300/20 bg-lime-400/10 text-lime-200",
  Mock: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
};

export function MissingDataPanel() {
  return (
    <section className="premium-panel overflow-hidden rounded-[1.25rem]">
      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="section-title">Data Completion Panel</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
              Datos pendientes para completar la plataforma
            </h2>
            <p className="mt-2 max-w-4xl text-[12px] leading-5 text-slate-400">
              Estado visible de datos faltantes, fuentes sugeridas, costo esperado y prioridad para convertir NSC Insights en una base interna completa.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-[12px]">
          <thead className="bg-white/[0.025] text-[9px] uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Dato faltante</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Por qué falta</th>
              <th className="px-4 py-3 font-semibold">Fuente/API sugerida</th>
              <th className="px-4 py-3 font-semibold">Free/Paid</th>
              <th className="px-4 py-3 font-semibold">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {missingDataItems.map((item) => (
              <tr key={item.item} className="border-t border-white/10 align-top transition hover:bg-white/[0.025]">
                <td className="px-4 py-3 font-semibold text-white">{item.item}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses[item.status]}`}>{item.status}</span>
                </td>
                <td className="max-w-xs px-4 py-3 leading-5 text-slate-400">{item.why}</td>
                <td className="max-w-sm px-4 py-3 leading-5 text-slate-300">{item.suggestedSource}</td>
                <td className="px-4 py-3 text-slate-300">{item.commercial}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${priorityClasses[item.priority]}`}>
                    {item.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
