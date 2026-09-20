import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import * as tasksApi from "@/api/tasks";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Task, TaskFilter, TaskFormValues } from "@/types/task";

export function useTasks(filter: TaskFilter) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // isLoading is true only for the very first fetch (shows the full skeleton).
  // isFetching is true for every fetch, including filter/page-triggered ones, so the
  // UI can show a subtle "refreshing" indicator without hiding the current table.
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const refetch = useCallback(async () => {
    setIsFetching(true);
    try {
      const result = await tasksApi.getTasks(filter);
      setTasks(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (!hasLoadedOnce.current) {
        // Nothing on screen yet — this is a real "couldn't load" state.
        setError(message);
      } else {
        // A filter/search/page-triggered refetch failed but we still have data on
        // screen — keep showing it instead of blanking the table, just notify.
        toast.error("Couldn't refresh tasks", { description: message });
      }
    } finally {
      setIsFetching(false);
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.status, filter.priority, filter.search, filter.page, filter.pageSize]);

  useEffect(() => {
    // Fetching from the API on mount/filter-change is the standard "synchronize with an
    // external system" effect use case; the setState calls inside refetch() are expected here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  async function createTask(values: TaskFormValues) {
    const created = await tasksApi.createTask(values);
    // The new task may not belong on the current page (server sort/paging decides
    // that), so re-fetch instead of guessing where to splice it in locally.
    await refetch();
    return created;
  }

  async function updateTask(id: number, values: TaskFormValues) {
    const updated = await tasksApi.updateTask(id, values);
    await refetch();
    return updated;
  }

  async function removeTask(id: number) {
    try {
      await tasksApi.deleteTask(id);
    } catch (err) {
      // A 404 here means the task is already gone server-side (e.g. a duplicate
      // click fired two deletes, or it was removed elsewhere). The end state the
      // user wanted — task gone — is already true, so this isn't a real failure.
      if (!isAxiosError(err) || err.response?.status !== 404) {
        throw err;
      }
    }
    await refetch();
  }

  return {
    tasks,
    totalCount,
    totalPages,
    isLoading,
    isFetching,
    error,
    refetch,
    createTask,
    updateTask,
    removeTask,
  };
}
