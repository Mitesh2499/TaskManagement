namespace TaskManagementAPI.Models;

public enum TaskAuditAction
{
    Created,
    Updated,
    Deleted,
}

public class TaskAuditLog
{
    public int Id { get; set; }
    public int TaskId { get; set; }

    // Snapshot of the title at the time of the change, so history still reads sensibly
    // if the title is later edited or the task is soft-deleted.
    public string TaskTitle { get; set; } = string.Empty;

    public int ChangedByUserId { get; set; }
    public User ChangedByUser { get; set; } = null!;

    public TaskAuditAction Action { get; set; }

    // Human-readable diff, e.g. "Status: ToDo → InProgress; Priority: Low → High".
    public string Summary { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; }
}
