using System.ComponentModel.DataAnnotations;
using TaskManagementAPI.Models;
using TaskManagementAPI.Validation;

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
    [MaxLength(200, ErrorMessage = "Title must be at most 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description must be at most 2000 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Status is required. Allowed values are: ToDo, InProgress, Done.")]
    [ValidEnum(typeof(TaskState))]
    public string Status { get; set; } = string.Empty;

    [Required(ErrorMessage = "Priority is required. Allowed values are: Low, Medium, High, Critical.")]
    [ValidEnum(typeof(TaskPriority))]
    public string Priority { get; set; } = string.Empty;

    [Required(ErrorMessage = "AssignedTo is required.")]
    [MaxLength(100, ErrorMessage = "AssignedTo must be at most 100 characters.")]
    public string AssignedTo { get; set; } = string.Empty;
}

public class UpdateTaskRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title must be at most 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description must be at most 2000 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Status is required. Allowed values are: ToDo, InProgress, Done.")]
    [ValidEnum(typeof(TaskState))]
    public string Status { get; set; } = string.Empty;

    [Required(ErrorMessage = "Priority is required. Allowed values are: Low, Medium, High, Critical.")]
    [ValidEnum(typeof(TaskPriority))]
    public string Priority { get; set; } = string.Empty;

    [Required(ErrorMessage = "AssignedTo is required.")]
    [MaxLength(100, ErrorMessage = "AssignedTo must be at most 100 characters.")]
    public string AssignedTo { get; set; } = string.Empty;
}

public class TaskSummaryDto
{
    public TaskState Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int Count { get; set; }
}
