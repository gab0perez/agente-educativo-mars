import { useState, useEffect, useCallback } from 'react';
import { LearningDashboardSnapshot } from '../domain/dashboardTypes';
import { DashboardService, dashboardService as defaultDashboardService } from '../service/DashboardService';

export interface UseLearningDashboardOptions {
  service?: DashboardService;
  autoRefreshIntervalMs?: number;
}

export function useLearningDashboard(options: UseLearningDashboardOptions = {}) {
  const service = options.service || defaultDashboardService;

  const [snapshot, setSnapshot] = useState<LearningDashboardSnapshot>(() =>
    service.getSnapshot()
  );
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const fresh = service.getSnapshot();
      setSnapshot(fresh);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    snapshot,
    loading,
    refresh
  };
}
