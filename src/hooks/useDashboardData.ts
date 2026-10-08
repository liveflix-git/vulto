import { useState, useEffect, useCallback } from 'react';
import {
  fetchRealDashboardOverview,
  DashboardOverviewRealData,
} from '../services/dashboardService';

export function useDashboardData() {
  const [data, setData] = useState<DashboardOverviewRealData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const result = await fetchRealDashboardOverview();
      setData(result);
    } catch (err) {
      console.error('Falha ao carregar métricas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refetch = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    data,
    loading,
    refreshing,
    refetch,
  };
}
