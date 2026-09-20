export type TaskStatus = "ToDo" | "InProgress" | "Done";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToUserId: number;
  assignedToName: string;
  createdDate: string;
  modifiedDate: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToUserId: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  assignedToUserId?: number;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TaskSummaryRow {
  status: TaskStatus;
  priority: TaskPriority;
  count: number;
}

export const TASK_STATUSES: TaskStatus[] = ["ToDo", "InProgress", "Done"];
export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Done: "Done",
};
