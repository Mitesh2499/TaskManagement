using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Data;

public static class SeedData
{
    // Fixed timestamp so the migration is deterministic (HasData requires constant values).
    private static readonly DateTime SeedDate = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    // All seed users share this BCrypt hash of "Password123!" — see README for the plaintext.
    private const string SeedPasswordHash = "$2a$11$v031RUj/qYLCCV9cimQLuuyPP4Yr9wTl1wVr4UPAD2XsobNyZoLSy";

    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Name = "Demo User", Email = "demo@example.com", PasswordHash = SeedPasswordHash, CreatedDate = SeedDate },
            new User { Id = 2, Name = "Alice Chen", Email = "alice.chen@example.com", PasswordHash = SeedPasswordHash, CreatedDate = SeedDate },
            new User { Id = 3, Name = "Bob Martinez", Email = "bob.martinez@example.com", PasswordHash = SeedPasswordHash, CreatedDate = SeedDate },
            new User { Id = 4, Name = "Priya Nair", Email = "priya.nair@example.com", PasswordHash = SeedPasswordHash, CreatedDate = SeedDate },
            new User { Id = 5, Name = "Diego Ruiz", Email = "diego.ruiz@example.com", PasswordHash = SeedPasswordHash, CreatedDate = SeedDate }
        );

        const int alice = 2;
        const int bob = 3;
        const int priya = 4;
        const int diego = 5;

        modelBuilder.Entity<TaskItem>().HasData(
            new TaskItem { Id = 1, Title = "Set up CI pipeline", Description = "Configure GitHub Actions for build and test.", Status = TaskState.Done, Priority = TaskPriority.High, AssignedToUserId = alice, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 2, Title = "Design database schema", Description = "Model tasks, users, and relationships.", Status = TaskState.Done, Priority = TaskPriority.Critical, AssignedToUserId = bob, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 3, Title = "Implement task API endpoints", Description = "CRUD endpoints for tasks with filtering.", Status = TaskState.InProgress, Priority = TaskPriority.High, AssignedToUserId = alice, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 4, Title = "Build login and signup UI", Description = "React pages for authentication.", Status = TaskState.InProgress, Priority = TaskPriority.Critical, AssignedToUserId = priya, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 5, Title = "Add JWT authentication", Description = "Issue and validate bearer tokens.", Status = TaskState.InProgress, Priority = TaskPriority.Critical, AssignedToUserId = bob, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 6, Title = "Write unit tests for TaskService", Description = "Cover filtering and sorting logic.", Status = TaskState.ToDo, Priority = TaskPriority.Medium, AssignedToUserId = diego, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 7, Title = "Style task table with priority badges", Description = "Colour-code priority in the UI.", Status = TaskState.ToDo, Priority = TaskPriority.Low, AssignedToUserId = priya, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 8, Title = "Set up Dockerfile for API", Description = "Multi-stage build for deployment.", Status = TaskState.ToDo, Priority = TaskPriority.Low, AssignedToUserId = diego, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 9, Title = "Write README setup instructions", Description = "Document how to run API and frontend.", Status = TaskState.ToDo, Priority = TaskPriority.Medium, AssignedToUserId = alice, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false },
            new TaskItem { Id = 10, Title = "Fix flaky summary endpoint test", Description = "Investigate intermittent failure in CI.", Status = TaskState.ToDo, Priority = TaskPriority.High, AssignedToUserId = bob, CreatedDate = SeedDate, ModifiedDate = SeedDate, IsDeleted = false }
        );
    }
}
