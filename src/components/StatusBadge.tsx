import type { DataStatus } from "../types/market";

const statusLabels: Record<DataStatus, string> = {
  online: "En línea",
  error: "Error",
  "missing-key": "Missing key",
  "missing-data": "Missing Data",
  mock: "Mock",
  partial: "Partial",
  loading: "Loading",
};

const statusClasses: Record<DataStatus, string> = {
  online: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  error: "border-red-400/30 bg-red-500/10 text-red-200",
  "missing-key": "border-amber-300/30 bg-amber-400/10 text-amber-100",
  "missing-data": "border-slate-400/25 bg-slate-500/10 text-slate-200",
  mock: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
  partial: "border-lime-300/30 bg-lime-400/10 text-lime-100",
  loading: "border-slate-400/20 bg-slate-500/10 text-slate-300",
};

interface StatusBadgeProps {
  status: DataStatus;
  className?: string;
  label?: string;
}

export function StatusBadge({ status, className = "", label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusClasses[status]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? statusLabels[status]}
    </span>
  );
}
