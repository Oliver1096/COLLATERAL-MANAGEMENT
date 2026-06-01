export type DataStatus =
  | "online"
  | "error"
  | "missing-key"
  | "missing-data"
  | "mock"
  | "partial"
  | "loading";

export type Priority = "Alta" | "Media" | "Baja";

export interface MetricData {
  id: string;
  label: string;
  value: string;
  rawValue?: number;
  unit?: string;
  change?: string;
  period?: string;
  source: string;
  status: DataStatus;
  error?: string;
}

export interface SourceHealth {
  id: string;
  name: string;
  status: DataStatus;
  description: string;
  lastUpdated?: string;
  error?: string;
}

export interface MissingDataItem {
  item: string;
  status: "Missing" | "Partial" | "Mock";
  why: string;
  suggestedSource: string;
  commercial: "Free" | "Likely paid" | "Paid" | "Mixed";
  priority: Priority;
}

export interface LatestUpdate {
  id: string;
  title: string;
  source: string;
  value: string;
  timestamp?: string;
  status: DataStatus;
}

export interface DashboardData {
  metrics: Record<string, MetricData>;
  sources: SourceHealth[];
  updates: LatestUpdate[];
  loading: boolean;
}
