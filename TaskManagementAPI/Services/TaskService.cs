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

    public async Task<PagedResult<TaskDto>> GetTasksAsync(
        TaskState? status,
        TaskPriority? priority,
        string? search,
        int? assignedToUserId,
        int page,
        int pageSize)
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

        if (assignedToUserId is not null)
        {
            query = query.Where(t => t.AssignedToUserId == assignedToUserId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(t => EF.Functions.Like(t.Title, $"%{term}%") || EF.Functions.Like(t.AssignedToUser.Name, $"%{term}%"));
        }

        // Count before paging, against the filtered-but-unpaged query.
        var totalCount = await query.CountAsync();

        query = query
            // Priority is persisted as a string (see AppDbContext's HasConversion<string>()), so
            // ordering by the enum directly would sort alphabetically ("Medium" > "Low" > "High" >
            // "Critical") instead of by actual urgency. This nested-ternary form translates to a SQL
            // CASE expression, giving true severity ordering: Critical > High > Medium > Low.
            .OrderByDescending(t =>
                t.Priority == TaskPriority.Critical ? 3 :
                t.Priority == TaskPriority.High ? 2 :
                t.Priority == TaskPriority.Medium ? 1 : 0)
            .ThenByDescending(t => t.ModifiedDate)
            .ThenBy(t => t.Id); // stable tie-break so Skip/Take pagination is deterministic

        var items = await query
            .Include(t => t.AssignedToUser)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<TaskDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<TaskDto?> GetTaskByIdAsync(int id)
    {
        var task = await _db.Tasks.Include(t => t.AssignedToUser).FirstOrDefaultAsync(t => t.Id == id);
        return task is null ? null : MapToDto(task);
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskRequest request)
    {
        var assignedToUser = await _db.Users.FindAsync(request.AssignedToUserId)
            ?? throw new UserNotFoundException(request.AssignedToUserId);

        var task = new TaskItem
        {
            Title = request.Title,
            Description = request.Description,
            Status = Enum.Parse<TaskState>(request.Status, ignoreCase: true),
            Priority = Enum.Parse<TaskPriority>(request.Priority, ignoreCase: true),
            AssignedToUserId = assignedToUser.Id,
            AssignedToUser = assignedToUser,
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request)
    {
        var task = await _db.Tasks.Include(t => t.AssignedToUser).FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return null;
        }

        if (task.AssignedToUserId != request.AssignedToUserId)
        {
            var assignedToUser = await _db.Users.FindAsync(request.AssignedToUserId)
                ?? throw new UserNotFoundException(request.AssignedToUserId);
            task.AssignedToUserId = assignedToUser.Id;
            task.AssignedToUser = assignedToUser;
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.Status = Enum.Parse<TaskState>(request.Status, ignoreCase: true);
        task.Priority = Enum.Parse<TaskPriority>(request.Priority, ignoreCase: true);

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
        AssignedToUserId = task.AssignedToUserId,
        AssignedToName = task.AssignedToUser.Name,
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
