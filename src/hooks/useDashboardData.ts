import { useEffect, useState } from "react";
import { loadDashboardData } from "../services/dashboardService";
import type { DashboardData } from "../types/market";

const initialData: DashboardData = {
  metrics: {},
  fredMetrics: [],
  sources: [],
  updates: [],
  loading: true,
};

export const useDashboardData = ({ enabled = true } = {}) => {
  const [data, setData] = useState<DashboardData>(initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!enabled) {
      setData({ ...initialData, loading: false });
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    const load = async () => {
      try {
        const dashboardData = await loadDashboardData();
        if (isMounted) {
          setData(dashboardData);
          setError(null);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unknown dashboard error.");
          setData((current) => ({ ...current, loading: false }));
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return { data, error };
};
