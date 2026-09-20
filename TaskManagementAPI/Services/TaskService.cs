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

    public async Task<TaskDto> CreateTaskAsync(CreateTaskRequest request, int actingUserId)
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
        await _db.SaveChangesAsync(); // assigns task.Id, needed for the audit log's FK below

        _db.TaskAuditLogs.Add(new TaskAuditLog
        {
            TaskId = task.Id,
            TaskTitle = task.Title,
            ChangedByUserId = actingUserId,
            Action = TaskAuditAction.Created,
            Summary = $"Created task, assigned to {assignedToUser.Name}",
            Timestamp = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request, int actingUserId)
    {
        var task = await _db.Tasks.Include(t => t.AssignedToUser).FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return null;
        }

        var oldTitle = task.Title;
        var oldDescription = task.Description;
        var oldStatus = task.Status;
        var oldPriority = task.Priority;
        var oldAssignedToName = task.AssignedToUser.Name;

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

        ApplyRowVersionCheck(task, request.RowVersion);

        var summary = BuildUpdateSummary(oldTitle, task.Title, oldDescription, task.Description, oldStatus, task.Status, oldPriority, task.Priority, oldAssignedToName, task.AssignedToUser.Name);
        if (summary is not null)
        {
            _db.TaskAuditLogs.Add(new TaskAuditLog
            {
                TaskId = task.Id,
                TaskTitle = task.Title,
                ChangedByUserId = actingUserId,
                Action = TaskAuditAction.Updated,
                Summary = summary,
                Timestamp = DateTime.UtcNow,
            });
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new TaskConcurrencyException(id);
        }

        return MapToDto(task);
    }

    public async Task<bool> SoftDeleteTaskAsync(int id, string? rowVersion, int actingUserId)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return false;
        }

        task.IsDeleted = true;

        if (!string.IsNullOrWhiteSpace(rowVersion))
        {
            ApplyRowVersionCheck(task, rowVersion);
        }

        _db.TaskAuditLogs.Add(new TaskAuditLog
        {
            TaskId = task.Id,
            TaskTitle = task.Title,
            ChangedByUserId = actingUserId,
            Action = TaskAuditAction.Deleted,
            Summary = "Deleted task",
            Timestamp = DateTime.UtcNow,
        });

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new TaskConcurrencyException(id);
        }

        return true;
    }

    /// <summary>
    /// Builds a human-readable diff of what changed, or null if nothing did (e.g. a save
    /// that resubmitted identical values) — callers skip writing an audit entry in that case.
    /// </summary>
    private static string? BuildUpdateSummary(
        string oldTitle, string newTitle,
        string? oldDescription, string? newDescription,
        TaskState oldStatus, TaskState newStatus,
        TaskPriority oldPriority, TaskPriority newPriority,
        string oldAssignedToName, string newAssignedToName)
    {
        var changes = new List<string>();

        if (oldTitle != newTitle)
        {
            changes.Add($"Title: \"{oldTitle}\" → \"{newTitle}\"");
        }

        if (oldStatus != newStatus)
        {
            changes.Add($"Status: {oldStatus} → {newStatus}");
        }

        if (oldPriority != newPriority)
        {
            changes.Add($"Priority: {oldPriority} → {newPriority}");
        }

        if (oldAssignedToName != newAssignedToName)
        {
            changes.Add($"Assigned to: {oldAssignedToName} → {newAssignedToName}");
        }

        if (oldDescription != newDescription)
        {
            changes.Add("Description updated");
        }

        return changes.Count > 0 ? string.Join("; ", changes) : null;
    }

    /// <summary>
    /// Tells EF Core "the version I last saw was this one" so the UPDATE statement's WHERE
    /// clause includes the original RowVersion. If another request already changed the row in
    /// between, zero rows match and EF throws DbUpdateConcurrencyException — a lost update
    /// caught instead of silently applied.
    /// </summary>
    private void ApplyRowVersionCheck(TaskItem task, string clientRowVersion)
    {
        byte[] originalRowVersion;
        try
        {
            originalRowVersion = Convert.FromBase64String(clientRowVersion);
        }
        catch (FormatException)
        {
            throw new ArgumentException("RowVersion is not a valid value.");
        }

        _db.Entry(task).Property(t => t.RowVersion).OriginalValue = originalRowVersion;
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

    public async Task<PagedResult<TaskAuditLogDto>> GetChangeLogAsync(int? taskId, int page, int pageSize)
    {
        var query = _db.TaskAuditLogs.Include(a => a.ChangedByUser).AsQueryable();

        if (taskId is not null)
        {
            query = query.Where(a => a.TaskId == taskId);
        }

        query = query.OrderByDescending(a => a.Timestamp).ThenByDescending(a => a.Id);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<TaskAuditLogDto>
        {
            Items = items.Select(a => new TaskAuditLogDto
            {
                Id = a.Id,
                TaskId = a.TaskId,
                TaskTitle = a.TaskTitle,
                ChangedByName = a.ChangedByUser.Name,
                Action = a.Action.ToString(),
                Summary = a.Summary,
                Timestamp = a.Timestamp,
            }).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
        };
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
        ModifiedDate = task.ModifiedDate,
        RowVersion = Convert.ToBase64String(task.RowVersion),
    };

    private class TaskSummaryRow
    {
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
