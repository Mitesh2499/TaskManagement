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
    public int AssignedToUserId { get; set; }
    public string AssignedToName { get; set; } = string.Empty;
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

    [Required(ErrorMessage = "AssignedToUserId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "AssignedToUserId must reference a valid user.")]
    public int AssignedToUserId { get; set; }
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

    [Required(ErrorMessage = "AssignedToUserId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "AssignedToUserId must reference a valid user.")]
    public int AssignedToUserId { get; set; }
}

public class TaskQueryFilter
{
    [ValidEnum(typeof(TaskState))]
    public string? Status { get; set; }

    [ValidEnum(typeof(TaskPriority))]
    public string? Priority { get; set; }

    [MaxLength(200, ErrorMessage = "Search must be at most 200 characters.")]
    public string? Search { get; set; }

    public int? AssignedToUserId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Page must be 1 or greater.")]
    public int Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "PageSize must be between 1 and 100.")]
    public int PageSize { get; set; } = 10;
}

public class TaskSummaryDto
{
    public TaskState Status { get; set; }
    public TaskPriority Priority { get; set; }
    public int Count { get; set; }
}
