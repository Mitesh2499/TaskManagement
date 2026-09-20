using TaskManagementAPI.Dtos;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Services;

public interface ITaskService
{
    Task<PagedResult<TaskDto>> GetTasksAsync(TaskState? status, TaskPriority? priority, string? search, int page, int pageSize);
    Task<TaskDto?> GetTaskByIdAsync(int id);
    Task<TaskDto> CreateTaskAsync(CreateTaskRequest request);
    Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request);
    Task<bool> SoftDeleteTaskAsync(int id);
    Task<IEnumerable<TaskSummaryDto>> GetSummaryAsync();
}
