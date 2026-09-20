using FluentAssertions;
using TaskManagementAPI.Data;
using TaskManagementAPI.Models;
using TaskManagementAPI.Services;
using TaskManagementAPI.Tests.TestSupport;

namespace TaskManagementAPI.Tests.Services;

/// <summary>
/// GetSummaryAsync runs a real raw SQL GROUP BY query (the InMemory provider doesn't execute
/// SQL at all), so these tests use a Sqlite in-memory database instead.
/// </summary>
public class TaskServiceSummaryTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Microsoft.Data.Sqlite.SqliteConnection _connection;
    private readonly TaskService _sut;

    public TaskServiceSummaryTests()
    {
        (_db, _connection) = TestDb.CreateSqlite();
        _sut = new TaskService(_db);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private void AddTask(TaskState status, TaskPriority priority, bool isDeleted = false)
    {
        _db.Tasks.Add(new TaskItem
        {
            Title = "t",
            Status = status,
            Priority = priority,
            AssignedTo = "a",
            IsDeleted = isDeleted,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
        });
        _db.SaveChanges();
    }

    [Fact]
    public async Task GetSummaryAsync_GroupsCountsByStatusAndPriority()
    {
        AddTask(TaskState.ToDo, TaskPriority.High);
        AddTask(TaskState.ToDo, TaskPriority.High);
        AddTask(TaskState.ToDo, TaskPriority.Low);
        AddTask(TaskState.Done, TaskPriority.Critical);

        var summary = (await _sut.GetSummaryAsync()).ToList();

        summary.Should().HaveCount(3);
        summary.Should().ContainSingle(r => r.Status == TaskState.ToDo && r.Priority == TaskPriority.High && r.Count == 2);
        summary.Should().ContainSingle(r => r.Status == TaskState.ToDo && r.Priority == TaskPriority.Low && r.Count == 1);
        summary.Should().ContainSingle(r => r.Status == TaskState.Done && r.Priority == TaskPriority.Critical && r.Count == 1);
    }

    [Fact]
    public async Task GetSummaryAsync_ExcludesSoftDeletedTasks()
    {
        AddTask(TaskState.ToDo, TaskPriority.High);
        AddTask(TaskState.ToDo, TaskPriority.High, isDeleted: true);

        var summary = (await _sut.GetSummaryAsync()).ToList();

        summary.Should().ContainSingle();
        summary.Single().Count.Should().Be(1);
    }

    [Fact]
    public async Task GetSummaryAsync_NoTasks_ReturnsEmpty()
    {
        var summary = await _sut.GetSummaryAsync();

        summary.Should().BeEmpty();
    }
}
