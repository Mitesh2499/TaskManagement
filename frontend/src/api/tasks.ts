import { apiClient } from "@/api/client";
import type { Task, TaskFilter, TaskFormValues, TaskSummaryRow } from "@/types/task";

export async function getTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const params: Record<string, string> = {};
  if (filter.status) params.status = filter.status;
  if (filter.priority) params.priority = filter.priority;

  const { data } = await apiClient.get<Task[]>("/api/tasks", { params });
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

export async function deleteTask(id: number): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`);
}
