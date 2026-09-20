# Task Management App — v1 Plan

## Existing setup (confirmed)
- `TaskManagementAPI/` — .NET 8 Web API (Minimal hosting `Program.cs`), currently the default template (WeatherForecast controller, Swashbuckle 6.6.2 installed).
- `frontend/` — Vite + React 19 + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`) already installed, ESLint configured.
- `TaskManagement.slnx` — solution references the API project only (frontend is a separate Node project, not part of the .sln).
- No database, no EF Core, no React Router, no HTTP client yet.
- Git repo initialized, no commits shown as tracked outside `.gitignore` yet.

This plan describes what v1 will add on top of that scaffold, package by package, file by file, so it can be reviewed before implementation starts.

**Update:** Authentication (email + password login/signup) is now a **core v1 requirement**, not a bonus — the app requires a logged-in user before any task data is visible or editable.

---

## 1. Backend — `TaskManagementAPI`

### 1.1 New NuGet packages
| Package | Purpose |
|---|---|
| `Microsoft.EntityFrameworkCore.SqlServer` | EF Core provider for SQL Server |
| `Microsoft.EntityFrameworkCore.Design` | Enables `dotnet ef migrations` tooling |
| `Microsoft.EntityFrameworkCore.Tools` | PMC/CLI migration commands |
| `FluentValidation.AspNetCore` (or DataAnnotations only) | Request validation — decision below |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | Validates JWT bearer tokens on protected endpoints |
| `BCrypt.Net-Next` | Password hashing for signup/login |

Decision: use **DataAnnotations** on request DTOs + `[ApiController]` automatic 400 model-state responses, instead of pulling in FluentValidation. Keeps dependencies minimal; can upgrade later if validation rules get complex.

Decision: hand-rolled auth (own `User` table + `BCrypt` hashing + JWT issuance) rather than ASP.NET Core Identity. Identity brings a lot of schema/plumbing (roles, tokens, lockouts) that this app doesn't need — a `Users` table with `Email`, `PasswordHash`, and a `/api/auth/login` endpoint that hands back a JWT is enough for "login and signup with email and password."

### 1.2 Domain model
`Models/TaskItem.cs`
```csharp
public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;      // required, max 200
    public string? Description { get; set; }                // optional, max 2000
    public Models.TaskStatus Status { get; set; }            // enum
    public TaskPriority Priority { get; set; }               // enum
    public string AssignedTo { get; set; } = string.Empty;   // required, max 100
    public DateTime CreatedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public bool IsDeleted { get; set; }
}
```
`Models/TaskStatus.cs` → enum `ToDo, InProgress, Done` (note: name it something other than `TaskStatus` to avoid collision with `System.Threading.Tasks.TaskStatus`; will call it `Models.TaskState` or fully qualify).
`Models/TaskPriority.cs` → enum `Low, Medium, High, Critical`.

Enums serialize as **strings** (`JsonStringEnumConverter`) so the API returns `"Status": "InProgress"` instead of an integer — friendlier for the React UI and for the required "Status must be a valid enum value" validation (invalid string → 400 automatically via model binding).

`Models/User.cs`
```csharp
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;       // required, unique, max 256
    public string PasswordHash { get; set; } = string.Empty; // BCrypt hash, never returned in any response
    public DateTime CreatedDate { get; set; }
}
```

### 1.3 EF Core
- `Data/AppDbContext.cs` — `DbSet<TaskItem> Tasks`, `DbSet<User> Users`, `OnModelCreating` sets up:
  - `Title` required, max length 200
  - `AssignedTo` required, max length 100
  - `User.Email` required, max length 256, **unique index** (`HasIndex(u => u.Email).IsUnique()`)
  - default `CreatedDate`/`ModifiedDate` via SQL `GETUTCDATE()` or set in code (prefer code, in `SaveChangesAsync` override, for portability/testability)
  - global query filter `HasQueryFilter(t => !t.IsDeleted)` on `TaskItem` so soft-deleted rows are excluded everywhere by default; explicit `.IgnoreQueryFilters()` used only where needed (none expected in v1).
- Connection string in `appsettings.json` → LocalDB: `Server=(localdb)\\mssqllocaldb;Database=TaskManagementDb;Trusted_Connection=True;MultipleActiveResultSets=true`
- Code-First migrations: `InitialCreate` (creates `Tasks` table), `AddUsers` (creates `Users` table) — or combined into one migration if added together.
- Seed data: EF `HasData` in `OnModelCreating` (or a `DbInitializer.SeedAsync` run at startup in Development) with **10 sample tasks** covering a mix of statuses/priorities/assignees. Using `HasData` keeps it reproducible via migration; if fixed `CreatedDate` values are needed for `HasData` (must be static/deterministic), that's fine for seed rows. One seed user (e.g. `demo@example.com` / a known dev-only password, hashed with `BCrypt`) so the reviewer can log in immediately — documented in the README, not left as a mystery credential.

### 1.4 DTOs (`Dtos/`)
- `TaskListItemDto` / `TaskDetailDto` — response shape (no need to separate for v1, one `TaskDto` works).
- `CreateTaskRequest` — Title (required), Description, Status, Priority, AssignedTo (required). DataAnnotations: `[Required, MaxLength(...)]`, enums validated automatically by JSON binding + `[EnumDataType]` as backup for form cases.
- `UpdateTaskRequest` — same shape as create (PUT, full replace) for v1 simplicity. (A PATCH-style partial update is a possible v2 enhancement, not required here.)
- `TaskSummaryDto` — `{ Status, Priority, Count }` for the summary endpoint.
- `RegisterRequest` — `{ Email, Password }`. DataAnnotations: `[Required, EmailAddress]` on Email, `[Required, MinLength(8)]` on Password.
- `LoginRequest` — `{ Email, Password }`, same validation as above.
- `AuthResponse` — `{ Token, Email, ExpiresAt }` — never includes the password or hash.
- Mapping done by hand in the controller/service (no AutoMapper — a couple of entities, not worth the dependency).

### 1.5 Service layer
`Services/ITaskService.cs` + `Services/TaskService.cs` — thin service between controller and `DbContext`, so:
- Controllers stay small (HTTP concerns only).
- There's an obvious seam for the "bonus: unit test a service method" item.

Methods:
```
Task<IEnumerable<TaskDto>> GetTasksAsync(TaskState? status, TaskPriority? priority, string? sortBy);
Task<TaskDto?> GetTaskByIdAsync(int id);
Task<TaskDto> CreateTaskAsync(CreateTaskRequest request);
Task<TaskDto?> UpdateTaskAsync(int id, UpdateTaskRequest request);
Task<bool> SoftDeleteTaskAsync(int id);
Task<IEnumerable<TaskSummaryDto>> GetSummaryAsync();  // raw SQL
```

**LINQ requirement** — `GetTasksAsync` demonstrates filtering + sorting:
```csharp
var query = _db.Tasks.AsQueryable();
if (status is not null) query = query.Where(t => t.Status == status);
if (priority is not null) query = query.Where(t => t.Priority == priority);
query = query
    .OrderByDescending(t => t.Priority)
    .ThenByDescending(t => t.ModifiedDate);
return await query.Select(t => MapToDto(t)).ToListAsync();
```

**Raw SQL requirement** — `GetSummaryAsync` uses a raw `GROUP BY`:
```sql
SELECT Status, Priority, COUNT(*) AS Count
FROM Tasks
WHERE IsDeleted = 0
GROUP BY Status, Priority
ORDER BY Status, Priority;
```
executed via `_db.Database.SqlQuery<TaskSummaryRow>($"...")` (EF Core 8's typed raw SQL query, no dummy DbSet needed) — exposed at `GET /api/tasks/summary`.

`Services/IAuthService.cs` + `Services/AuthService.cs`:
```
Task<AuthResponse> RegisterAsync(RegisterRequest request);  // throws on duplicate email
Task<AuthResponse?> LoginAsync(LoginRequest request);        // null on bad credentials
```
- `RegisterAsync`: checks email uniqueness, hashes password with `BCrypt.Net.BCrypt.HashPassword`, saves `User`, issues a JWT.
- `LoginAsync`: looks up by email, verifies with `BCrypt.Net.BCrypt.Verify`, issues a JWT on success.
- `Services/TokenService.cs` — builds the JWT (claims: `sub`=user id, `email`), signed with a symmetric key from config (`Jwt:Secret` in `appsettings.json`, overridden via env var / user-secrets — **never committed**), configurable expiry (e.g. 2 hours for a take-home demo).

### 1.6 Authentication & authorization
- `Controllers/AuthController.cs`:
  | Verb | Route | Notes |
  |---|---|---|
  | POST | `/api/auth/register` | 201 + `AuthResponse` (token), 409 if email already exists |
  | POST | `/api/auth/login` | 200 + `AuthResponse`, 401 on bad credentials |
- JWT bearer auth wired in `Program.cs` (`AddAuthentication().AddJwtBearer(...)`, `AddAuthorization()`), `app.UseAuthentication()` before `app.UseAuthorization()`.
- `TasksController` gets `[Authorize]` at the controller level — every task endpoint requires a valid bearer token. `AuthController`'s two endpoints stay `[AllowAnonymous]`.
- Passwords: never logged, never returned in any DTO; only the BCrypt hash is persisted.
- Scope note: no roles/permissions in v1 — any authenticated user can see and edit all tasks (matches "internal team" scenario in the brief). Per-user task ownership is out of scope unless asked for.

### 1.7 Controllers (`Controllers/TasksController.cs`)
| Verb | Route | Notes |
|---|---|---|
| GET | `/api/tasks?status=&priority=` | filter via query string, optional — requires auth |
| GET | `/api/tasks/summary` | **must be mapped before** `/api/tasks/{id}` to avoid route collision — requires auth |
| GET | `/api/tasks/{id}` | 404 if not found or soft-deleted — requires auth |
| POST | `/api/tasks` | 201 + Location header — requires auth |
| PUT | `/api/tasks/{id}` | 200 or 404 — requires auth |
| DELETE | `/api/tasks/{id}` | soft-delete → sets `IsDeleted = true`, 204 — requires auth |

### 1.8 Global exception handling
.NET 8's built-in `IExceptionHandler` (registered via `AddExceptionHandler<GlobalExceptionHandler>()` + `UseExceptionHandler()`), returning **`ProblemDetails`** consistently:
```json
{ "type": "...", "title": "An unexpected error occurred", "status": 500, "traceId": "..." }
```
Combined with `AddProblemDetails()` so validation errors (400), not-found (404), and auth failures (401/409) all follow the same `ProblemDetails` shape for a consistent contract.

### 1.9 Program.cs wiring
- `AddDbContext<AppDbContext>(UseSqlServer(...))`
- `AddControllers()` + `JsonStringEnumConverter`
- `AddScoped<ITaskService, TaskService>()`, `AddScoped<IAuthService, AuthService>()`, `AddScoped<ITokenService, TokenService>()`
- `AddAuthentication(JwtBearerDefaults...).AddJwtBearer(...)`, `AddAuthorization()`
- `AddExceptionHandler<GlobalExceptionHandler>()`, `AddProblemDetails()`
- `AddCors()` — allow the Vite dev origin (`http://localhost:5173`) since front-end and back-end run on separate ports
- `app.UseAuthentication()` then `app.UseAuthorization()` (order matters), before `app.MapControllers()`
- Swagger stays enabled (already present) for manual API exploration; add a bearer-token auth scheme to the Swagger config so protected endpoints can be tested from the Swagger UI directly
- Remove `WeatherForecastController.cs` / `WeatherForecast.cs` (leftover template files)

### 1.10 Bonus items (only if time remains, in this order)
1. Unit tests: new `TaskManagementAPI.Tests` (xUnit + EF Core InMemory or Sqlite in-memory) covering `TaskService.GetTasksAsync` filtering logic and `AuthService.LoginAsync` (bad password / bad email cases).
2. Dockerise the application: Dockerfile for the API (multi-stage build) + `docker-compose.yml` with a `mssql` container, so the whole stack runs without LocalDB.
3. Shared .NET Standard library (`TaskManagement.Shared`) holding the `TaskStatus`/`TaskPriority` enums + a validation constant (e.g. max title length), referenced by the API — demonstrates cross-project sharing. Kept optional since it adds a project reference for a trivial payoff at this scale.

(Auth itself has moved out of this bonus list into core scope — see §1.6 and §2.6.)

---

## 2. Frontend — `frontend/`

### 2.1 New packages
| Package | Purpose |
|---|---|
| `axios` | HTTP client (small wrapper over fetch, easy error handling; also used to attach the JWT to every request) |
| `react-router-dom` | Client-side routing — needed now that there are distinct `/login`, `/signup`, and the main task-board routes, with route guarding |
| none else required | Tailwind v4 already installed; no component library needed per spec ("no CSS framework requirement") |

Kept deliberately minimal — no React Query/Redux for a single-resource CRUD app; local `useState`/`useEffect` plus a small `AuthContext` is enough for v1 and keeps the Claude Code log focused on the actual feature.

### 2.2 Structure
```
src/
  api/
    client.ts        // axios instance, baseURL from VITE_API_URL, request interceptor attaches JWT, response interceptor redirects to /login on 401
    tasks.ts          // getTasks, getTask, createTask, updateTask, deleteTask, getSummary
    auth.ts           // login, register
  auth/
    AuthContext.tsx    // holds { token, email }, exposes login()/register()/logout(), persists token to localStorage
    ProtectedRoute.tsx // wraps task-board routes, redirects to /login if no token
  types/
    task.ts           // TaskStatus, TaskPriority enums/unions, Task interface, matching backend DTOs
    auth.ts           // LoginRequest, RegisterRequest, AuthResponse
  pages/
    LoginPage.tsx       // email + password form, link to signup
    SignupPage.tsx      // email + password (+ confirm password) form, link to login
    TaskBoardPage.tsx   // composes FilterBar + TaskTable + TaskForm (the existing App.tsx content, moved here)
  components/
    TaskTable.tsx      // main list — table layout, status dropdown per row, priority badge
    TaskForm.tsx        // create-task form (modal or inline panel)
    PriorityBadge.tsx   // colour-coded priority chip (Low=grey, Medium=blue, High=orange, Critical=red)
    StatusSelect.tsx    // dropdown used both in table row and form
    FilterBar.tsx        // status/priority filter controls above the table
    SummaryPanel.tsx     // small stat cards from /api/tasks/summary (nice-to-have, low effort given the endpoint exists)
    NavBar.tsx            // shows logged-in email + logout button, visible on task-board routes
  App.tsx               // sets up <BrowserRouter>/<AuthProvider>, defines routes: /login, /signup, / (protected → TaskBoardPage)
```

### 2.3 Behavior
- On load: `AuthContext` checks `localStorage` for a saved token; if present, treated as logged in (no server-side "whoami" call needed for v1 — token presence is enough, expiry handled by 401 → redirect).
- Unauthenticated user hitting `/` (or any protected route) → redirected to `/login`.
- `LoginPage` → `POST /api/auth/login` → on success, token stored (context + localStorage) → redirect to `/`. On 401, inline error "Invalid email or password."
- `SignupPage` → `POST /api/auth/register` → on success, treated as auto-login (token returned directly) → redirect to `/`. On 409, inline error "An account with this email already exists."
- `NavBar` → logout clears token from context + localStorage → redirect to `/login`.
- Task board (existing plan, now behind auth):
  - `GET /api/tasks` (no filter) → render table.
  - Filter bar changes → re-fetch with `status`/`priority` query params.
  - "New Task" button → opens `TaskForm` → `POST /api/tasks` → prepend to list (or re-fetch).
  - Status dropdown in each row → `PUT /api/tasks/{id}` with updated status, optimistic UI update, revert on error.
  - Delete button → confirm → `DELETE /api/tasks/{id}` (soft-delete) → remove from local list.
  - Priority shown as a coloured badge/icon in its own column.
  - Basic loading/error states (spinner text + inline error banner) — no toast library, keep it simple.
  - Any `401` from the API (expired/invalid token) → axios response interceptor clears the stored token and redirects to `/login`.

### 2.4 Env config
`.env` (gitignored) → `VITE_API_URL=https://localhost:5001` (or whatever port `launchSettings.json` assigns); `.env.example` committed for setup instructions.

### 2.5 Out of scope for v1
- Drag-and-drop status changes (dropdown satisfies the requirement; DnD is a stretch goal only if time allows).
- Pagination (10+ seed rows don't need it).
- Password reset / "forgot password" flow (not requested — only login + signup).
- Per-user task ownership / roles (matches backend scope note in §1.6).

### 2.6 Authentication UI summary
- Two new pages (`LoginPage`, `SignupPage`), each a simple centered card form: email input, password input (signup adds confirm-password with client-side match check), submit button, inline error message area, link to the other page.
- `AuthContext` + `ProtectedRoute` gate access to the task board — this is the main structural change to `App.tsx` (adds `react-router-dom` and route definitions).
- Token stored in `localStorage` (acceptable for a take-home demo scope; a production app would weigh httpOnly cookies instead — noted here as a conscious trade-off, not an oversight).

---

## 3. Database

- LocalDB via EF Core migrations (`dotnet ef database update`), no separate `.sql` seed script needed — `HasData` migration covers "seed script or migration with ≥10 tasks," plus one seed `User` row for login.
- Raw SQL summary query lives inside `TaskService.GetSummaryAsync` (see §1.5), exposed as `GET /api/tasks/summary`.

---

## 4. Delivery checklist mapping (from the challenge doc)

| Requirement | Where it's covered |
|---|---|e
| List + filter by status/priority | §1.7 GET /api/tasks |
| Get by id | §1.7 GET /api/tasks/{id} |
| Create | §1.7 POST |
| Update | §1.7 PUT |
| Soft-delete | §1.7 DELETE → IsDeleted flag |
| Entity fields | §1.2 |
| EF Core Code First + migrations | §1.3 |
| Input validation | §1.4 DataAnnotations |
| Global exception handler | §1.8 |
| LINQ filter/sort example | §1.5 GetTasksAsync |
| React table/card UI | §2.2–2.3 |
| Create form | §2.2 TaskForm |
| Update status | §2.3 StatusSelect |
| Priority colour-coding | §2.2 PriorityBadge |
| Seed ≥10 tasks | §1.3 HasData |
| Raw SQL summary endpoint | §1.5 + §1.7 |
| **Authentication (login/signup, email + password)** | **§1.5 AuthService, §1.6 AuthController + JWT, §2.6 Login/Signup pages** |
| Bonus items (tests, Docker, shared lib) | §1.10 |

---

## 5. Open questions before implementation starts

1. Keep PUT as full-replace update, or add PATCH for partial updates (e.g. status-only change from the table)? Plan assumes PUT is fine since the whole form re-submits on edit, and the table's status dropdown can still call PUT with the full current object.
2. Pursue any remaining bonus items (tests, Docker, shared lib) now, or ship core requirements (including auth) first and revisit bonuses only if time remains? Plan assumes core-first, bonuses in listed order only if time allows.
3. Confirm target DB is LocalDB (not Docker SQL Server) for local dev — plan defaults to LocalDB since it's simpler on Windows without extra setup, with Docker Compose as an optional bonus.
4. JWT storage: plan defaults to `localStorage` for simplicity (see §2.6) — confirm that's acceptable for this take-home, or if httpOnly cookie-based auth is preferred (adds CORS/cookie complexity for comparatively little benefit at this scale).
5. Should signup be open to anyone (as currently planned), or should the app ship with only the one seeded demo user and no public signup? Plan assumes open signup since the brief explicitly asks for both login and signup.
