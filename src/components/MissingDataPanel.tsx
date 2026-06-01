import { AlertTriangle } from "lucide-react";
import { missingDataItems } from "../data/missingData";

const priorityClasses = {
  Alta: "bg-red-500/10 text-red-200 border-red-400/25",
  Media: "bg-amber-400/10 text-amber-100 border-amber-300/25",
  Baja: "bg-slate-400/10 text-slate-200 border-slate-300/20",
};

const statusClasses = {
  Missing: "text-red-200",
  Partial: "text-lime-200",
  Mock: "text-cyan-200",
};

export function MissingDataPanel() {
  return (
    <section className="glass-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Data Completion Panel
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Datos pendientes para completar la plataforma
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              Esta tabla deja visible que falta, por que falta, que fuente podria cubrirlo, si probablemente requiere
              API comercial y la prioridad para convertir NSC Insights en una base interna completa.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Dato faltante</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Por que falta</th>
              <th className="px-5 py-4 font-semibold">Fuente/API sugerida</th>
              <th className="px-5 py-4 font-semibold">Free/Paid</th>
              <th className="px-5 py-4 font-semibold">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {missingDataItems.map((item) => (
              <tr key={item.item} className="border-t border-white/10 align-top">
                <td className="px-5 py-4 font-semibold text-white">{item.item}</td>
                <td className={`px-5 py-4 font-semibold ${statusClasses[item.status]}`}>{item.status}</td>
                <td className="max-w-xs px-5 py-4 leading-6 text-slate-400">{item.why}</td>
                <td className="max-w-sm px-5 py-4 leading-6 text-slate-300">{item.suggestedSource}</td>
                <td className="px-5 py-4 text-slate-300">{item.commercial}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClasses[item.priority]}`}>
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
