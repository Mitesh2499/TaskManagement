using TaskManagementAPI.Dtos;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Services;

public class UserNotFoundException : Exception
{
    public UserNotFoundException(int userId) : base($"User with id {userId} was not found.")
    {
    }
}

public class TaskConcurrencyException : Exception
{
    public TaskConcurrencyException(int taskId)
        : base($"Task {taskId} was changed by someone else since you loaded it. Please refresh and try again.")
    {
    }
}

public interface ITaskService
{
    Task<PagedResult<TaskDto>> GetTasksAsync(
        TaskState? status,
        TaskPriority? priority,
        string? search,
        int? assignedToUserId,
        int page,
        int pageSize);
    Task<TaskDto?> GetTaskByIdAsync(int id);
    Task<TaskDto> CreateTaskAsync(CreateTaskRequest request, int actingUserId);
    Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request, int actingUserId);
    Task<bool> SoftDeleteTaskAsync(int id, string? rowVersion, int actingUserId);
    Task<IEnumerable<TaskSummaryDto>> GetSummaryAsync();
    Task<PagedResult<TaskAuditLogDto>> GetChangeLogAsync(int? taskId, int page, int pageSize);
}
