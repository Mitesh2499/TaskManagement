import { useCallback, useEffect, useState } from "react";
import * as tasksApi from "@/api/tasks";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Task, TaskFilter, TaskFormValues } from "@/types/task";

export function useTasks(filter: TaskFilter) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tasksApi.getTasks(filter);
      setTasks(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.status, filter.priority]);

  useEffect(() => {
    // Fetching from the API on mount/filter-change is the standard "synchronize with an
    // external system" effect use case; the setState calls inside refetch() are expected here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  async function createTask(values: TaskFormValues) {
    const created = await tasksApi.createTask(values);
    setTasks((prev) => [created, ...prev]);
    return created;
  }

  async function updateTask(id: number, values: TaskFormValues) {
    const updated = await tasksApi.updateTask(id, values);
    setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
    return updated;
  }

  async function removeTask(id: number) {
    await tasksApi.deleteTask(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  return { tasks, isLoading, error, refetch, createTask, updateTask, removeTask };
}
