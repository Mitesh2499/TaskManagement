using System.ComponentModel.DataAnnotations;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Dtos;

public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskState Status { get; set; }
    public TaskPriority Priority { get; set; }
    public string AssignedTo { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
}

public class CreateTaskRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [EnumDataType(typeof(TaskState), ErrorMessage = "Status must be a valid status value.")]
    public TaskState Status { get; set; }

    [Required]
    [EnumDataType(typeof(TaskPriority), ErrorMessage = "Priority must be a valid priority value.")]
    public TaskPriority Priority { get; set; }

    [Required(ErrorMessage = "AssignedTo is required.")]
    [MaxLength(100)]
    public string AssignedTo { get; set; } = string.Empty;
}

public class UpdateTaskRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    [EnumDataType(typeof(TaskState), ErrorMessage = "Status must be a valid status value.")]
    public TaskState Status { get; set; }

    [Required]
    [EnumDataType(typeof(TaskPriority), ErrorMessage = "Priority must be a valid priority value.")]
    public TaskPriority Priority { get; set; }

    [Required(ErrorMessage = "AssignedTo is required.")]
    [MaxLength(100)]
    public string AssignedTo { get; set; } = string.Empty;
}

public class TaskSummaryDto
{
    public TaskState Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int Count { get; set; }
}
