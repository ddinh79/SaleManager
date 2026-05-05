import { useState, useEffect, useCallback } from 'react';
import { dailyPlanService } from '../services/dailyPlanService';
export function useDailyPlan() {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadPlan = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await dailyPlanService.getTodayPlan();
            setPlan(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load plan');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadPlan();
    }, [loadPlan]);
    const completeTask = useCallback(async (taskId, request) => {
        await dailyPlanService.completeTask(taskId, request);
        await loadPlan();
    }, [loadPlan]);
    const skipTask = useCallback(async (taskId, request) => {
        await dailyPlanService.skipTask(taskId, request);
        await loadPlan();
    }, [loadPlan]);
    const activateTask = useCallback(async (taskId) => {
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
