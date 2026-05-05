import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { TaskItem, TasksResponse, TaskFilter, TasksSummary } from '../types';

export function useTasks(initialFilter: TaskFilter = 'ALL') {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: TasksResponse = await taskService.getTasks(filter);
      setTasks(response.tasks);
      setSummary(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const snooze = useCallback(async (taskId: string, taskType: string, days: number) => {
    await taskService.snoozeTask(taskId, taskType, days);
    await loadTasks();
  }, [loadTasks]);

  const complete = useCallback(async (taskId: string, taskType: string) => {
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