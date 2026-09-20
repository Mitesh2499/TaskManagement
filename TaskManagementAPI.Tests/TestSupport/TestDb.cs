using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;

namespace TaskManagementAPI.Tests.TestSupport;

/// <summary>
/// AppDbContext's OnModelCreating seeds 10 demo tasks + 1 demo user via HasData, which EF Core
/// applies to a freshly-created database regardless of provider (InMemory or Sqlite). Every helper
/// here wipes that seed data immediately after creation so each test starts from a clean, fully
/// controlled slate instead of silently depending on the app's demo seed content.
/// </summary>
public static class TestDb
{
    public static AppDbContext CreateInMemory(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"{name}-{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        ClearSeedData(db);
        return db;
    }

    /// <summary>
    /// Sqlite in-memory keeps the database alive only while the returned connection stays open,
    /// and (unlike the InMemory provider) actually executes raw SQL — needed for testing
    /// TaskService.GetSummaryAsync, which runs a real GROUP BY query. Dispose both.
    /// </summary>
    public static (AppDbContext Db, SqliteConnection Connection) CreateSqlite()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        // Skip HasData seeding entirely here: SeedData's TaskItem rows don't (and can't) set
        // RowVersion — SQL Server's real rowversion column rejects explicit inserts into it —
        // and Sqlite has no equivalent auto-generation, so applying that seed data against
        // Sqlite fails a NOT NULL check during table creation. These tests don't need it anyway.
        var db = new AppDbContext(options, applySeedData: false);
        db.Database.EnsureCreated();
        return (db, connection);
    }

    private static void ClearSeedData(AppDbContext db)
    {
        db.Tasks.RemoveRange(db.Tasks.IgnoreQueryFilters());
        db.Users.RemoveRange(db.Users);
        db.SaveChanges();
    }
}
