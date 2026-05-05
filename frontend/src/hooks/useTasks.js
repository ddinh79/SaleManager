import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
export function useTasks(initialFilter = 'ALL') {
    const [tasks, setTasks] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState(initialFilter);
    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await taskService.getTasks(filter);
            setTasks(response.tasks);
            setSummary(response.summary);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
        }
        finally {
            setLoading(false);
        }
    }, [filter]);
    useEffect(() => {
        loadTasks();
    }, [loadTasks]);
    const snooze = useCallback(async (taskId, taskType, days) => {
        await taskService.snoozeTask(taskId, taskType, days);
        await loadTasks();
    }, [loadTasks]);
    const complete = useCallback(async (taskId, taskType) => {
        await taskService.completeTask(taskId, taskType);
        await loadTasks();
    }, [loadTasks]);
    return {
        tasks,
        summary,
        loading,
        error,
        filter,
        setFilter,
        snooze,
        complete,
        refresh: loadTasks,
    };
}
