# Backend Unit Tests & Coverage

`TaskManagementAPI.Tests` is an xUnit project covering the service layer (`TaskService`, `AuthService`) and the custom `ValidEnumAttribute` validation logic — the parts of the API that contain actual business rules, as opposed to controllers (thin HTTP plumbing) or EF Core migrations (generated scaffolding).

## Running the tests

```bash
dotnet test TaskManagementAPI.Tests
```

Result at the time of writing:

```
Passed!  - Failed: 0, Passed: 36, Skipped: 0, Total: 36, Duration: 2 s
```

## What's covered

| Test file | Focus |
|---|---|
| `Services/TaskServiceTests.cs` | Filtering by status/priority, search (title + assignee, case-insensitive), pagination (page slicing, `totalCount`/`totalPages`), priority sort order, soft-delete semantics, create/update/get-by-id behavior |
| `Services/TaskServiceSummaryTests.cs` | The raw-SQL `GetSummaryAsync` GROUP BY query, run against a real Sqlite in-memory database (the EF Core InMemory provider doesn't execute SQL at all, so it can't exercise this method) |
| `Services/AuthServiceTests.cs` | Registration (email normalization, password hashing, duplicate-email rejection), login (correct/incorrect password, unknown email, case-insensitive email matching) |
| `Validation/ValidEnumAttributeTests.cs` | Null/blank passthrough (so `[Required]` owns that message), valid enum names in any casing, and the friendly "Invalid X. Allowed values are: …" message for bad input |

### A real bug this suite caught

Writing `GetTasksAsync_OrdersByPrioritySeverityDescending_NotAlphabetically` surfaced an actual bug: `Priority` is persisted as a string (`HasConversion<string>()` in `AppDbContext`), so the original `OrderByDescending(t => t.Priority)` sorted **alphabetically** ("Medium" > "Low" > "High" > "Critical") instead of by real urgency. Fixed in `TaskService.GetTasksAsync` by ranking priority through a translatable ternary expression (`Critical ? 3 : High ? 2 : Medium ? 1 : 0`) instead of ordering the raw enum/string. This is exactly the kind of regression unit tests are supposed to catch before a reviewer notices the task list is sorted wrong.

## Test infrastructure

- **`TestSupport/TestDb.cs`** — `AppDbContext.OnModelCreating` seeds 10 demo tasks + 1 demo user via `HasData`, and EF Core applies that seed data to *any* freshly-created database regardless of provider. Every test helper wipes it immediately after creation so each test starts from an explicit, controlled slate instead of silently depending on the app's demo content.
  - `CreateInMemory(name)` — EF Core InMemory provider, used for everything except the raw-SQL summary query.
  - `CreateSqlite()` — a real Sqlite database over an in-memory connection, since `GetSummaryAsync` executes actual SQL that the InMemory provider can't run. Returns the `SqliteConnection` too — it must stay open for the database's lifetime and be disposed alongside the context.
- **`TestSupport/TestConfig.cs`** — builds an `IConfiguration` with a valid (test-only) `Jwt:Secret` so `TokenService`/`AuthService` can be constructed without touching `appsettings.json`.

## Generating a coverage report

```bash
# From the repo root — restores the reportgenerator tool pinned in dotnet-tools.json
dotnet tool restore

# Run tests and collect Cobertura coverage
dotnet test TaskManagementAPI.Tests --collect:"XPlat Code Coverage"

# Turn the Cobertura XML into an HTML + Markdown report
dotnet tool run reportgenerator \
  -reports:"TaskManagementAPI.Tests/TestResults/**/coverage.cobertura.xml" \
  -targetdir:"CoverageReport" \
  -reporttypes:"Html;MarkdownSummaryGithub;TextSummary"
```

Open `CoverageReport/index.html` for the interactive report (line-by-line, per file). Both `TestResults/` and `CoverageReport/` are gitignored — they're build output, regenerated on demand, not checked in.

## Coverage results

Generated 2026-09-20 against the test run above.

| Metric | Value |
|---|---|
| Line coverage (whole project) | 28.7% (318 / 1107 coverable lines) |
| Branch coverage (whole project) | 43% (37 / 86) |
| Method coverage (whole project) | 70.7% (75 / 106) |

That whole-project number is low because it includes code this suite deliberately doesn't target: HTTP controllers (thin pass-through to the services, better suited to integration tests), `Program.cs` (the composition root — wiring, not logic), and EF Core's auto-generated `Migrations/` folder. Broken down by class, the actual business-logic layer this task asked for is thoroughly covered:

| Class | Line coverage | Branch coverage |
|---|---:|---:|
| `TaskService` | **100%** | 100% |
| `AuthService` | **93%** | 100% |
| `TokenService` | 85.2% | 50% |
| `ValidEnumAttribute` | **100%** | 75% |
| `AppDbContext` | 100% | 100% |
| `EmailAlreadyExistsException` | 100% | — |
| Controllers, `Program.cs`, `GlobalExceptionHandler`, EF Migrations | 0% | 0% |

The 0%-covered group is a known, intentional gap, not an oversight: it's the natural boundary between *unit* tests (this suite) and *integration* tests (e.g. `WebApplicationFactory`-based tests hitting real HTTP endpoints), which would be the logical next step if this project's test coverage were extended further.
