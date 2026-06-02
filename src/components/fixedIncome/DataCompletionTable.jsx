const priorityClasses = {
  High: "border-red-400/25 bg-red-500/10 text-red-200",
  Medium: "border-amber-300/25 bg-amber-400/10 text-amber-100",
  "Low/Medium": "border-slate-300/20 bg-slate-400/10 text-slate-200",
};

const rows = [
  ["Corporate bond prices", "Missing", "Bloomberg / Refinitiv / FactSet / Intrinio", "Paid", "High"],
  ["Corporate bond spreads", "Partial", "FRED ICE BofA series / Bloomberg", "Free/Paid", "High"],
  ["ETF holdings", "Missing", "FMP commercial / ETF provider / Bloomberg", "Paid", "Medium"],
  ["Mexico sovereign curve", "Missing", "Banxico / market data provider", "Free/Paid", "Medium"],
  ["Euro sovereign yields", "Partial", "ECB / Eurostat / market provider", "Free/Paid", "Medium"],
  ["Credit ratings", "Missing", "S&P / Moody's / Fitch / Bloomberg", "Paid", "Medium"],
  ["MBS/ABS data", "Missing", "Bloomberg / Refinitiv / TRACE", "Paid", "Low/Medium"],
  ["Fixed income analytics", "Future build", "Internal calculations / external data", "Internal/Paid", "High"],
];

export function DataCompletionTable() {
  return (
    <section className="premium-panel overflow-hidden rounded-[1.25rem]">
      <div className="border-b border-white/10 p-4 sm:p-5">
        <p className="section-title">Data completion</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Datos pendientes para completar Renta Fija</h2>
        <p className="mt-2 max-w-4xl text-[12px] leading-5 text-slate-400">
          Cobertura faltante para convertir Renta Fija en una terminal completa de curvas, crédito, instrumentos y ETFs.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left text-[12px]">
          <thead className="bg-white/[0.025] text-[9px] uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Data needed</th>
              <th className="px-4 py-3 font-semibold">Current status</th>
              <th className="px-4 py-3 font-semibold">Suggested source</th>
              <th className="px-4 py-3 font-semibold">Free or paid</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([needed, status, source, cost, priority]) => (
              <tr key={needed} className="border-t border-white/10 transition hover:bg-white/[0.025]">
                <td className="px-4 py-3 font-semibold text-white">{needed}</td>
                <td className="px-4 py-3 text-slate-300">{status}</td>
                <td className="px-4 py-3 text-slate-400">{source}</td>
                <td className="px-4 py-3 text-slate-300">{cost}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${priorityClasses[priority]}`}>{priority}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
