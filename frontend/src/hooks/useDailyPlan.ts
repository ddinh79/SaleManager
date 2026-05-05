import { useState, useEffect, useCallback } from 'react';
import { dailyPlanService } from '../services/dailyPlanService';
import { DailyPlan, ManualCompleteRequest, SkipTaskRequest } from '../types';

export function useDailyPlan() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dailyPlanService.getTodayPlan();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const completeTask = useCallback(async (taskId: string, request: ManualCompleteRequest) => {
    await dailyPlanService.completeTask(taskId, request);
    await loadPlan();
  }, [loadPlan]);

  const skipTask = useCallback(async (taskId: string, request: SkipTaskRequest) => {
    await dailyPlanService.skipTask(taskId, request);
    await loadPlan();
  }, [loadPlan]);

  const activateTask = useCallback(async (taskId: string) => {
    await dailyPlanService.activateTask(taskId);
    await loadPlan();
  }, [loadPlan]);

  return {
    plan,
    loading,
    error,
    completeTask,
    skipTask,
    activateTask,
    refresh: loadPlan,
  };
}