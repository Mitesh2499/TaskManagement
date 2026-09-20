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
    Task<TaskDto> CreateTaskAsync(CreateTaskRequest request);
    Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request);
    Task<bool> SoftDeleteTaskAsync(int id, string? rowVersion);
    Task<IEnumerable<TaskSummaryDto>> GetSummaryAsync();
}
