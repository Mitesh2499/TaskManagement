using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagementAPI.Dtos;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _db;

    public TaskService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TaskDto>> GetTasksAsync(TaskState? status, TaskPriority? priority)
    {
        // LINQ requirement: dynamic filtering + sorting over the task set.
        var query = _db.Tasks.AsQueryable();

        if (status is not null)
        {
            query = query.Where(t => t.Status == status);
        }

        if (priority is not null)
        {
            query = query.Where(t => t.Priority == priority);
        }

        query = query
            .OrderByDescending(t => t.Priority)
            .ThenByDescending(t => t.ModifiedDate);

        return await query.Select(t => MapToDto(t)).ToListAsync();
    }

    public async Task<TaskDto?> GetTaskByIdAsync(int id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        return task is null ? null : MapToDto(task);
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskRequest request)
    {
        var task = new TaskItem
        {
            Title = request.Title,
            Description = request.Description,
            Status = request.Status,
            Priority = request.Priority,
            AssignedTo = request.AssignedTo
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return null;
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.AssignedTo = request.AssignedTo;

        await _db.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<bool> SoftDeleteTaskAsync(int id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return false;
        }

        task.IsDeleted = true;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<TaskSummaryDto>> GetSummaryAsync()
    {
        // Raw SQL requirement: grouped summary query, run directly against the database.
        var rows = await _db.Database
            .SqlQuery<TaskSummaryRow>($"""
                SELECT Status, Priority, COUNT(*) AS Count
                FROM Tasks
                WHERE IsDeleted = 0
                GROUP BY Status, Priority
                ORDER BY Status, Priority
                """)
            .ToListAsync();

        return rows.Select(r => new TaskSummaryDto
        {
            Status = Enum.Parse<TaskState>(r.Status),
            Priority = Enum.Parse<TaskPriority>(r.Priority),
            Count = r.Count
        });
    }

    private static TaskDto MapToDto(TaskItem task) => new()
    {
        Id = task.Id,
        Title = task.Title,
        Description = task.Description,
        Status = task.Status,
        Priority = task.Priority,
        AssignedTo = task.AssignedTo,
        CreatedDate = task.CreatedDate,
        ModifiedDate = task.ModifiedDate
    };

    private class TaskSummaryRow
    {
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
