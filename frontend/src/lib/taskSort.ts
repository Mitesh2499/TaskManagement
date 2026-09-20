import type { Task, TaskPriority, TaskStatus } from "@/types/task";

export type SortKey = "title" | "status" | "priority" | "assignedToName" | "modifiedDate";
export type SortDirection = "asc" | "desc";

const STATUS_ORDER: Record<TaskStatus, number> = { ToDo: 0, InProgress: 1, Done: 2 };
const PRIORITY_ORDER: Record<TaskPriority, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

function compareTasks(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title);
    case "assignedToName":
      return a.assignedToName.localeCompare(b.assignedToName);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "priority":
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    case "modifiedDate":
      return new Date(a.modifiedDate).getTime() - new Date(b.modifiedDate).getTime();
  }
}

export function sortTasks(tasks: Task[], key: SortKey, direction: SortDirection): Task[] {
  const sorted = [...tasks].sort((a, b) => compareTasks(a, b, key));
  return direction === "asc" ? sorted : sorted.reverse();
}
