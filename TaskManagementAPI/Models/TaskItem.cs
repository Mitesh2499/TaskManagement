namespace TaskManagementAPI.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskState Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int AssignedToUserId { get; set; }
    public User AssignedToUser { get; set; } = null!;
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public bool IsDeleted { get; set; }

    // SQL Server ROWVERSION: the database auto-increments this on every UPDATE, and EF Core
    // uses it as an optimistic concurrency token. Since any team member can edit or delete
    // any task (no ownership restriction), two people editing the same task at once is a real
    // scenario — this makes the second save fail with a clear conflict instead of silently
    // overwriting the first person's change.
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
