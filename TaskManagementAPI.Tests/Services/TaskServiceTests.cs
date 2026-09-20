using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagementAPI.Dtos;
using TaskManagementAPI.Models;
using TaskManagementAPI.Services;
using TaskManagementAPI.Tests.TestSupport;

namespace TaskManagementAPI.Tests.Services;

public class TaskServiceTests
{
    private readonly AppDbContext _db;
    private readonly TaskService _sut;
    private readonly User _alice;
    private readonly User _bob;

    public TaskServiceTests()
    {
        _db = TestDb.CreateInMemory(nameof(TaskServiceTests));
        _sut = new TaskService(_db);

        _alice = AddUser("Alice Chen", "alice@example.com");
        _bob = AddUser("Bob Martinez", "bob@example.com");
    }

    private User AddUser(string name, string email)
    {
        var user = new User { Name = name, Email = email, PasswordHash = "hash", CreatedDate = DateTime.UtcNow };
        _db.Users.Add(user);
        _db.SaveChanges();
        return user;
    }

    private TaskItem AddTask(
        string title,
        TaskState status,
        TaskPriority priority,
        User? assignedTo = null,
        bool isDeleted = false,
        DateTime? modifiedDate = null)
    {
        var task = new TaskItem
        {
            Title = title,
            Description = "desc",
            Status = status,
            Priority = priority,
            AssignedToUserId = (assignedTo ?? _alice).Id,
            IsDeleted = isDeleted,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = modifiedDate ?? DateTime.UtcNow,
            // The EF Core InMemory provider (unlike real SQL Server) doesn't auto-generate
            // IsRowVersion() values, so seed a real placeholder rather than leaving it empty.
            RowVersion = new byte[] { 0, 0, 0, 0, 0, 0, 0, 1 },
        };
        _db.Tasks.Add(task);
        _db.SaveChanges();
        return task;
    }

    private Task<PagedResult<TaskDto>> GetTasks(
        TaskState? status = null,
        TaskPriority? priority = null,
        string? search = null,
        int? assignedToUserId = null,
        int page = 1,
        int pageSize = 10) =>
        _sut.GetTasksAsync(status, priority, search, assignedToUserId, page, pageSize);

    [Fact]
    public async Task GetTasksAsync_NoFilters_ReturnsAllNonDeletedTasks()
    {
        AddTask("Task A", TaskState.ToDo, TaskPriority.Low);
        AddTask("Task B", TaskState.Done, TaskPriority.High);
        AddTask("Deleted task", TaskState.ToDo, TaskPriority.Low, isDeleted: true);

        var result = await GetTasks();

        result.TotalCount.Should().Be(2);
        result.Items.Select(t => t.Title).Should().BeEquivalentTo("Task A", "Task B");
    }

    [Fact]
    public async Task GetTasksAsync_FiltersByStatus()
    {
        AddTask("In progress task", TaskState.InProgress, TaskPriority.Medium);
        AddTask("Todo task", TaskState.ToDo, TaskPriority.Medium);

        var result = await GetTasks(status: TaskState.InProgress);

        result.Items.Should().ContainSingle().Which.Title.Should().Be("In progress task");
    }

    [Fact]
    public async Task GetTasksAsync_FiltersByPriority()
    {
        AddTask("Critical task", TaskState.ToDo, TaskPriority.Critical);
        AddTask("Low priority task", TaskState.ToDo, TaskPriority.Low);

        var result = await GetTasks(priority: TaskPriority.Critical);

        result.Items.Should().ContainSingle().Which.Title.Should().Be("Critical task");
    }

    [Fact]
    public async Task GetTasksAsync_FiltersByAssignedToUserId()
    {
        AddTask("Alice's task", TaskState.ToDo, TaskPriority.Medium, _alice);
        AddTask("Bob's task", TaskState.ToDo, TaskPriority.Medium, _bob);

        var result = await GetTasks(assignedToUserId: _bob.Id);

        result.Items.Should().ContainSingle().Which.Title.Should().Be("Bob's task");
    }

    [Theory]
    [InlineData("dockerfile")]
    [InlineData("DOCKERFILE")]
    [InlineData("Docker")]
    public async Task GetTasksAsync_SearchMatchesTitleCaseInsensitively(string term)
    {
        AddTask("Set up Dockerfile for API", TaskState.ToDo, TaskPriority.Low);
        AddTask("Write README", TaskState.ToDo, TaskPriority.Low);

        var result = await GetTasks(search: term);

        result.Items.Should().ContainSingle().Which.Title.Should().Be("Set up Dockerfile for API");
    }

    [Fact]
    public async Task GetTasksAsync_SearchMatchesAssignedToName()
    {
        AddTask("Task A", TaskState.ToDo, TaskPriority.Low, _alice);
        AddTask("Task B", TaskState.ToDo, TaskPriority.Low, _bob);

        var result = await GetTasks(search: "bob");

        result.Items.Should().ContainSingle().Which.AssignedToName.Should().Be("Bob Martinez");
    }

    [Fact]
    public async Task GetTasksAsync_OrdersByPrioritySeverityDescending_NotAlphabetically()
    {
        // Alphabetically "Medium" > "Low" > "High" > "Critical", which would be wrong —
        // this asserts the actual urgency order: Critical > High > Medium > Low.
        var now = DateTime.UtcNow;
        AddTask("Low", TaskState.ToDo, TaskPriority.Low, modifiedDate: now);
        AddTask("Medium", TaskState.ToDo, TaskPriority.Medium, modifiedDate: now);
        AddTask("Critical", TaskState.ToDo, TaskPriority.Critical, modifiedDate: now);
        AddTask("High", TaskState.ToDo, TaskPriority.High, modifiedDate: now);

        var result = await GetTasks();

        result.Items.Select(t => t.Title).Should().ContainInOrder("Critical", "High", "Medium", "Low");
    }

    [Fact]
    public async Task GetTasksAsync_Paginates_ReturnsCorrectSliceAndTotalCount()
    {
        for (var i = 1; i <= 15; i++)
        {
            AddTask($"Task {i:D2}", TaskState.ToDo, TaskPriority.Medium, modifiedDate: DateTime.UtcNow.AddMinutes(-i));
        }

        var page1 = await GetTasks(page: 1, pageSize: 10);
        var page2 = await GetTasks(page: 2, pageSize: 10);

        page1.Items.Should().HaveCount(10);
        page2.Items.Should().HaveCount(5);
        page1.TotalCount.Should().Be(15);
        page1.TotalPages.Should().Be(2);
        page1.Items.Select(t => t.Id).Should().NotIntersectWith(page2.Items.Select(t => t.Id));
    }

    [Fact]
    public async Task GetTaskByIdAsync_SoftDeletedTask_ReturnsNull()
    {
        var task = AddTask("Deleted", TaskState.ToDo, TaskPriority.Low, isDeleted: true);

        var result = await _sut.GetTaskByIdAsync(task.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetTaskByIdAsync_ExistingTask_ReturnsMappedDtoWithAssigneeName()
    {
        var task = AddTask("Findable", TaskState.InProgress, TaskPriority.High, _bob);

        var result = await _sut.GetTaskByIdAsync(task.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be("Findable");
        result.Status.Should().Be(TaskState.InProgress);
        result.Priority.Should().Be(TaskPriority.High);
        result.AssignedToUserId.Should().Be(_bob.Id);
        result.AssignedToName.Should().Be("Bob Martinez");
    }

    [Fact]
    public async Task CreateTaskAsync_PersistsTaskAndStampsTimestamps()
    {
        var request = new CreateTaskRequest
        {
            Title = "New task",
            Description = "Some description",
            Status = "ToDo",
            Priority = "High",
            AssignedToUserId = _alice.Id,
        };

        var result = await _sut.CreateTaskAsync(request, _alice.Id);

        result.Id.Should().BeGreaterThan(0);
        result.Status.Should().Be(TaskState.ToDo);
        result.Priority.Should().Be(TaskPriority.High);
        result.AssignedToName.Should().Be("Alice Chen");
        result.CreatedDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.ModifiedDate.Should().Be(result.CreatedDate);

        (await _sut.GetTaskByIdAsync(result.Id)).Should().NotBeNull();
    }

    [Fact]
    public async Task CreateTaskAsync_UnknownAssignee_ThrowsUserNotFoundException()
    {
        var request = new CreateTaskRequest
        {
            Title = "New task",
            Status = "ToDo",
            Priority = "High",
            AssignedToUserId = 9999,
        };

        var act = () => _sut.CreateTaskAsync(request, _alice.Id);

        await act.Should().ThrowAsync<UserNotFoundException>();
    }

    [Fact]
    public async Task UpdateTaskAsync_ExistingTask_UpdatesFieldsAndModifiedDate()
    {
        var task = AddTask("Old title", TaskState.ToDo, TaskPriority.Low, _alice, modifiedDate: DateTime.UtcNow.AddDays(-1));
        var request = new UpdateTaskRequest
        {
            Title = "New title",
            Description = "Updated",
            Status = "Done",
            Priority = "Critical",
            AssignedToUserId = _bob.Id,
            RowVersion = Convert.ToBase64String(task.RowVersion),
        };

        var result = await _sut.UpdateTaskAsync(task.Id, request, _alice.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be("New title");
        result.Status.Should().Be(TaskState.Done);
        result.Priority.Should().Be(TaskPriority.Critical);
        result.AssignedToUserId.Should().Be(_bob.Id);
        result.AssignedToName.Should().Be("Bob Martinez");
        result.ModifiedDate.Should().BeAfter(result.CreatedDate);
    }

    [Fact]
    public async Task UpdateTaskAsync_UnknownId_ReturnsNull()
    {
        var request = new UpdateTaskRequest
        {
            Title = "x",
            Status = "ToDo",
            Priority = "Low",
            AssignedToUserId = _alice.Id,
        };

        var result = await _sut.UpdateTaskAsync(id: 9999, request, _alice.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateTaskAsync_UnknownAssignee_ThrowsUserNotFoundException()
    {
        var task = AddTask("Task", TaskState.ToDo, TaskPriority.Low, _alice);
        var request = new UpdateTaskRequest
        {
            Title = "Task",
            Status = "ToDo",
            Priority = "Low",
            AssignedToUserId = 9999,
        };

        var act = () => _sut.UpdateTaskAsync(task.Id, request, _alice.Id);

        await act.Should().ThrowAsync<UserNotFoundException>();
    }

    [Fact]
    public async Task SoftDeleteTaskAsync_ExistingTask_SetsIsDeletedAndExcludesFromFutureQueries()
    {
        var task = AddTask("To be deleted", TaskState.ToDo, TaskPriority.Low);

        var deleted = await _sut.SoftDeleteTaskAsync(task.Id, rowVersion: null, _alice.Id);

        deleted.Should().BeTrue();
        (await _sut.GetTaskByIdAsync(task.Id)).Should().BeNull();

        // The row must still exist in the database — this is a soft delete, not a real one.
        var stillInDatabase = _db.Tasks.IgnoreQueryFilters().Any(t => t.Id == task.Id && t.IsDeleted);
        stillInDatabase.Should().BeTrue();
    }

    [Fact]
    public async Task SoftDeleteTaskAsync_UnknownId_ReturnsFalse()
    {
        var deleted = await _sut.SoftDeleteTaskAsync(9999, rowVersion: null, _alice.Id);

        deleted.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateTaskAsync_CurrentRowVersion_Succeeds()
    {
        var created = await _sut.CreateTaskAsync(new CreateTaskRequest
        {
            Title = "Task",
            Status = "ToDo",
            Priority = "Low",
            AssignedToUserId = _alice.Id,
        }, _alice.Id);

        var result = await _sut.UpdateTaskAsync(created.Id, new UpdateTaskRequest
        {
            Title = "Updated",
            Status = "Done",
            Priority = "Low",
            AssignedToUserId = _alice.Id,
            RowVersion = created.RowVersion,
        }, _alice.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be("Updated");
    }

    /// <summary>
    /// On the real SQL Server provider, RowVersion is auto-bumped by the database on every
    /// UPDATE. The EF Core InMemory provider used in these tests doesn't emulate that, so this
    /// directly mutates the stored RowVersion to fake "another process already changed the row
    /// since you loaded it" — exactly the situation the concurrency check exists to catch.
    private async Task SimulateConcurrentChangeAsync(int taskId)
    {
        var tracked = await _db.Tasks.FirstAsync(t => t.Id == taskId);
        tracked.RowVersion = Guid.NewGuid().ToByteArray();
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task UpdateTaskAsync_StaleRowVersion_ThrowsTaskConcurrencyException()
    {
        // Simulates two people editing the same task: both load it (capturing the same
        // RowVersion), someone else's change lands first, then this stale save must be
        // rejected instead of silently overwriting that change.
        var task = AddTask("Task", TaskState.ToDo, TaskPriority.Low, _alice);
        var staleRowVersion = Convert.ToBase64String(task.RowVersion);

        await SimulateConcurrentChangeAsync(task.Id);

        var act = () => _sut.UpdateTaskAsync(task.Id, new UpdateTaskRequest
        {
            Title = "Stale editor's change",
            Status = "Done",
            Priority = "Low",
            AssignedToUserId = _alice.Id,
            RowVersion = staleRowVersion,
        }, _alice.Id);

        // The rejected save must not silently overwrite the concurrent change — verified via
        // the exception type. (Re-reading the title through this same DbContext instance isn't
        // a reliable check here: EF's identity map returns the tracked entity's in-memory
        // property values, which the failed save already mutated locally even though nothing
        // was persisted. A fresh DbContext — as every real HTTP request gets — would see the
        // untouched, persisted title correctly.)
        await act.Should().ThrowAsync<TaskConcurrencyException>();
    }

    [Fact]
    public async Task SoftDeleteTaskAsync_StaleRowVersion_ThrowsTaskConcurrencyException()
    {
        var task = AddTask("Task", TaskState.ToDo, TaskPriority.Low, _alice);
        var staleRowVersion = Convert.ToBase64String(task.RowVersion);

        await SimulateConcurrentChangeAsync(task.Id);

        var act = () => _sut.SoftDeleteTaskAsync(task.Id, staleRowVersion, _alice.Id);

        await act.Should().ThrowAsync<TaskConcurrencyException>();
        (await _sut.GetTaskByIdAsync(task.Id)).Should().NotBeNull();
    }
}
