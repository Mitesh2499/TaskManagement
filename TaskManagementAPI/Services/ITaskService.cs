using TaskManagementAPI.Dtos;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Services;

public interface ITaskService
{
    Task<IEnumerable<TaskDto>> GetTasksAsync(TaskState? status, TaskPriority? priority);
    Task<TaskDto?> GetTaskByIdAsync(int id);
    Task<TaskDto> CreateTaskAsync(CreateTaskRequest request);
    Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request);
    Task<bool> SoftDeleteTaskAsync(int id);
    Task<IEnumerable<TaskSummaryDto>> GetSummaryAsync();
}
