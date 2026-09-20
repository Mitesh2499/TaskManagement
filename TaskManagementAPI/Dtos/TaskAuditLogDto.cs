namespace TaskManagementAPI.Dtos;

public class TaskAuditLogDto
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public string ChangedByName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
