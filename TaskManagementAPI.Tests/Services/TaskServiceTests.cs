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

    public TaskServiceTests()
    {
        _db = TestDb.CreateInMemory(nameof(TaskServiceTests));
        _sut = new TaskService(_db);
    }

    private TaskItem AddTask(
        string title,
        TaskState status,
        TaskPriority priority,
        string assignedTo = "Alice",
        bool isDeleted = false,
        DateTime? modifiedDate = null)
    {
        var task = new TaskItem
        {
            Title = title,
            Description = "desc",
            Status = status,
            Priority = priority,
            AssignedTo = assignedTo,
            IsDeleted = isDeleted,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = modifiedDate ?? DateTime.UtcNow,
        };
        _db.Tasks.Add(task);
        _db.SaveChanges();
        return task;
    }

    [Fact]
    public async Task GetTasksAsync_NoFilters_ReturnsAllNonDeletedTasks()
    {
        AddTask("Task A", TaskState.ToDo, TaskPriority.Low);
        AddTask("Task B", TaskState.Done, TaskPriority.High);
        AddTask("Deleted task", TaskState.ToDo, TaskPriority.Low, isDeleted: true);

        var result = await _sut.GetTasksAsync(status: null, priority: null, search: null, page: 1, pageSize: 10);

        result.TotalCount.Should().Be(2);
        result.Items.Select(t => t.Title).Should().BeEquivalentTo("Task A", "Task B");
    }

    [Fact]
    public async Task GetTasksAsync_FiltersByStatus()
    {
        AddTask("In progress task", TaskState.InProgress, TaskPriority.Medium);
        AddTask("Todo task", TaskState.ToDo, TaskPriority.Medium);

        var result = await _sut.GetTasksAsync(TaskState.InProgress, null, null, 1, 10);

        result.Items.Should().ContainSingle().Which.Title.Should().Be("In progress task");
    }

    [Fact]
    public async Task GetTasksAsync_FiltersByPriority()
    {
        AddTask("Critical task", TaskState.ToDo, TaskPriority.Critical);
        AddTask("Low priority task", TaskState.ToDo, TaskPriority.Low);

        var result = await _sut.GetTasksAsync(null, TaskPriority.Critical, null, 1, 10);

        result.Items.Should().ContainSingle().Which.Title.Should().Be("Critical task");
    }

    [Theory]
    [InlineData("dockerfile")]
    [InlineData("DOCKERFILE")]
    [InlineData("Docker")]
    public async Task GetTasksAsync_SearchMatchesTitleCaseInsensitively(string term)
    {
        AddTask("Set up Dockerfile for API", TaskState.ToDo, TaskPriority.Low, "Diego");
        AddTask("Write README", TaskState.ToDo, TaskPriority.Low, "Alice");

        var result = await _sut.GetTasksAsync(null, null, term, 1, 10);

        result.Items.Should().ContainSingle().Which.Title.Should().Be("Set up Dockerfile for API");
    }

    [Fact]
    public async Task GetTasksAsync_SearchMatchesAssignedTo()
    {
        AddTask("Task A", TaskState.ToDo, TaskPriority.Low, assignedTo: "Priya Nair");
        AddTask("Task B", TaskState.ToDo, TaskPriority.Low, assignedTo: "Bob Martinez");

        var result = await _sut.GetTasksAsync(null, null, "priya", 1, 10);

        result.Items.Should().ContainSingle().Which.AssignedTo.Should().Be("Priya Nair");
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

        var result = await _sut.GetTasksAsync(null, null, null, 1, 10);

        result.Items.Select(t => t.Title).Should().ContainInOrder("Critical", "High", "Medium", "Low");
    }

    [Fact]
    public async Task GetTasksAsync_Paginates_ReturnsCorrectSliceAndTotalCount()
    {
        for (var i = 1; i <= 15; i++)
        {
            AddTask($"Task {i:D2}", TaskState.ToDo, TaskPriority.Medium, modifiedDate: DateTime.UtcNow.AddMinutes(-i));
        }

        var page1 = await _sut.GetTasksAsync(null, null, null, page: 1, pageSize: 10);
        var page2 = await _sut.GetTasksAsync(null, null, null, page: 2, pageSize: 10);

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
    public async Task GetTaskByIdAsync_ExistingTask_ReturnsMappedDto()
    {
        var task = AddTask("Findable", TaskState.InProgress, TaskPriority.High, "Bob");

        var result = await _sut.GetTaskByIdAsync(task.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be("Findable");
        result.Status.Should().Be(TaskState.InProgress);
        result.Priority.Should().Be(TaskPriority.High);
        result.AssignedTo.Should().Be("Bob");
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
            AssignedTo = "Alice",
        };

        var result = await _sut.CreateTaskAsync(request);

        result.Id.Should().BeGreaterThan(0);
        result.Status.Should().Be(TaskState.ToDo);
        result.Priority.Should().Be(TaskPriority.High);
        result.CreatedDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.ModifiedDate.Should().Be(result.CreatedDate);

        (await _sut.GetTaskByIdAsync(result.Id)).Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateTaskAsync_ExistingTask_UpdatesFieldsAndModifiedDate()
    {
        var task = AddTask("Old title", TaskState.ToDo, TaskPriority.Low, modifiedDate: DateTime.UtcNow.AddDays(-1));
        var request = new UpdateTaskRequest
        {
            Title = "New title",
            Description = "Updated",
            Status = "Done",
            Priority = "Critical",
            AssignedTo = "Bob",
        };

        var result = await _sut.UpdateTaskAsync(task.Id, request);

        result.Should().NotBeNull();
        result!.Title.Should().Be("New title");
        result.Status.Should().Be(TaskState.Done);
        result.Priority.Should().Be(TaskPriority.Critical);
        result.AssignedTo.Should().Be("Bob");
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
            AssignedTo = "x",
        };

        var result = await _sut.UpdateTaskAsync(id: 9999, request);

        result.Should().BeNull();
    }

    [Fact]
    public async Task SoftDeleteTaskAsync_ExistingTask_SetsIsDeletedAndExcludesFromFutureQueries()
    {
        var task = AddTask("To be deleted", TaskState.ToDo, TaskPriority.Low);

        var deleted = await _sut.SoftDeleteTaskAsync(task.Id);

        deleted.Should().BeTrue();
        (await _sut.GetTaskByIdAsync(task.Id)).Should().BeNull();

        // The row must still exist in the database — this is a soft delete, not a real one.
        var stillInDatabase = _db.Tasks.IgnoreQueryFilters().Any(t => t.Id == task.Id && t.IsDeleted);
        stillInDatabase.Should().BeTrue();
    }

    [Fact]
    public async Task SoftDeleteTaskAsync_UnknownId_ReturnsFalse()
    {
        var deleted = await _sut.SoftDeleteTaskAsync(9999);

        deleted.Should().BeFalse();
    }
}
