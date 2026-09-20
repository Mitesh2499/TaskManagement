export interface TaskAuditLog {
  id: number;
  taskId: number;
  taskTitle: string;
  changedByName: string;
  action: "Created" | "Updated" | "Deleted";
  summary: string;
  timestamp: string;
}
