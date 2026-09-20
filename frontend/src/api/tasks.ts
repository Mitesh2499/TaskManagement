import { apiClient } from "@/api/client";
import type { PagedResult, Task, TaskFilter, TaskFormValues, TaskSummaryRow } from "@/types/task";

export async function getTasks(filter: TaskFilter = {}): Promise<PagedResult<Task>> {
  const params: Record<string, string | number> = {
    page: filter.page ?? 1,
    pageSize: filter.pageSize ?? 10,
  };
  if (filter.status) params.status = filter.status;
  if (filter.priority) params.priority = filter.priority;
  if (filter.search) params.search = filter.search;
  if (filter.assignedToUserId) params.assignedToUserId = filter.assignedToUserId;

  const { data } = await apiClient.get<PagedResult<Task>>("/api/tasks", { params });
  return data;
}

export async function getTaskById(id: number): Promise<Task> {
  const { data } = await apiClient.get<Task>(`/api/tasks/${id}`);
  return data;
}

export async function getTaskSummary(): Promise<TaskSummaryRow[]> {
  const { data } = await apiClient.get<TaskSummaryRow[]>("/api/tasks/summary");
  return data;
}

export async function createTask(values: TaskFormValues): Promise<Task> {
  const { data } = await apiClient.post<Task>("/api/tasks", values);
  return data;
}

export async function updateTask(id: number, values: TaskFormValues): Promise<Task> {
  const { data } = await apiClient.put<Task>(`/api/tasks/${id}`, values);
  return data;
}

export async function deleteTask(id: number, rowVersion?: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`, { params: rowVersion ? { rowVersion } : undefined });
}
