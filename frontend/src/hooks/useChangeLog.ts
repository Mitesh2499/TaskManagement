import { useCallback, useEffect, useState } from "react";
import { getChangeLog, getTaskChangeLog } from "@/api/tasks";
import { getApiErrorMessage } from "@/lib/apiError";
import type { TaskAuditLog } from "@/types/auditLog";

const PAGE_SIZE = 20;

/**
 * Fetches a page of the audit trail — every task's changes when `taskId` is omitted, or
 * just one task's history when it's provided. Used by both the global change log dialog
 * and the task detail page's activity section.
 */
export function useChangeLog(taskId?: number, enabled = true) {
  const [entries, setEntries] = useState<TaskAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (pageToLoad: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = taskId
          ? await getTaskChangeLog(taskId, pageToLoad, PAGE_SIZE)
          : await getChangeLog(pageToLoad, PAGE_SIZE);
        setEntries(result.items);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [taskId],
  );

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/page-change, standard data-sync effect.
    load(page);
  }, [load, page, enabled]);

  function goToPage(next: number) {
    setPage(Math.max(1, Math.min(next, totalPages)));
  }

  const refetch = useCallback(() => load(page), [load, page]);

  return { entries, page, totalPages, totalCount, isLoading, error, goToPage, refetch };
}
