using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Models;

namespace TaskManagementAPI.Data;

public class AppDbContext : DbContext
{
    private readonly bool _applySeedData;

    public AppDbContext(DbContextOptions<AppDbContext> options) : this(options, applySeedData: true)
    {
    }

    // Test-only escape hatch: SeedData's TaskItem rows can't set RowVersion (SQL Server's real
    // rowversion type rejects explicit inserts into it — the engine manages it exclusively), so
    // seeding against a provider that lacks SQL Server's auto-generation, like Sqlite, fails a
    // NOT NULL check during table creation. Tests that don't need the demo seed data at all
    // (most don't — see TestDb) construct with applySeedData: false to sidestep that entirely.
    public AppDbContext(DbContextOptions<AppDbContext> options, bool applySeedData) : base(options)
    {
        _applySeedData = applySeedData;
    }

    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.Property(t => t.Title).IsRequired().HasMaxLength(200);
            entity.Property(t => t.Description).HasMaxLength(2000);
            entity.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(t => t.Priority).HasConversion<string>().HasMaxLength(20);
            entity.HasQueryFilter(t => !t.IsDeleted);

            entity.HasOne(t => t.AssignedToUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            if (Database.IsSqlServer())
            {
                // Real DB-generated rowversion: SQL Server auto-increments this on every write
                // and rejects explicit inserts into it — nothing in app code ever sets it.
                entity.Property(t => t.RowVersion).IsRowVersion();
            }
            else
            {
                // Sqlite (and the InMemory provider used in most tests) have no equivalent
                // auto-generated column, and IsRowVersion() would make EF silently drop the
                // column from every INSERT regardless of what value is set, since it always
                // defers generation to the database. IsConcurrencyToken() alone keeps the same
                // optimistic-concurrency check semantics (a stale OriginalValue still causes
                // DbUpdateConcurrencyException) while letting the value be set/persisted
                // normally — enough to exercise the app's own concurrency-handling logic.
                entity.Property(t => t.RowVersion).IsConcurrencyToken();
            }
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Name).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();
        });

        if (_applySeedData)
        {
            SeedData.Apply(modelBuilder);
        }
    }

    public override int SaveChanges()
    {
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyTimestamps()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<TaskItem>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedDate = now;
                entry.Entity.ModifiedDate = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModifiedDate = now;
            }
        }
    }
}
