import { useCallback, useEffect, useState } from "react";
import * as tasksApi from "@/api/tasks";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Task, TaskFormValues } from "@/types/task";

export function useTask(id: number) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tasksApi.getTaskById(id);
      setTask(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/id-change effect.
    refetch();
  }, [refetch]);

  async function updateTask(values: TaskFormValues) {
    const updated = await tasksApi.updateTask(id, values);
    setTask(updated);
    return updated;
  }

  async function removeTask(rowVersion?: string) {
    await tasksApi.deleteTask(id, rowVersion);
  }

  return { task, isLoading, error, refetch, updateTask, removeTask };
}
