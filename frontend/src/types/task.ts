export type ColumnId = "todo" | "inProgress" | "done";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type TaskStatusLabel =
  | "Not Started"
  | "In Research"
  | "On Track"
  | "At Risk"
  | "Complete";

export interface Assignee {
  id: string;
  name: string;
  colorClass: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  statusLabel: TaskStatusLabel;
  priority: TaskPriority;
  dueDate: string;
  assignees: Assignee[];
  commentCount: number;
  linkCount: number;
  checklistDone: number;
  checklistTotal: number;
}

export interface Column {
  id: ColumnId;
  title: string;
  dotColorClass: string;
  tasks: Task[];
}
