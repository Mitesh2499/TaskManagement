# Task Management App

A lightweight task management system for an internal team: a .NET 8 Web API backed by SQL Server (EF Core, Code First) with JWT email/password authentication, and a React + TypeScript front-end (Vite + Tailwind CSS v4 + shadcn/ui) with a Kanban board and a sortable/filterable list view.

See [PLAN.md](PLAN.md) for the original design plan and requirement-to-implementation mapping, and [TESTING.md](TESTING.md) for the backend unit test suite and coverage report.

## Project layout

```
TaskManagementAPI/       .NET 8 Web API — EF Core, JWT auth, task CRUD + summary endpoint
TaskManagementAPI.Tests/ xUnit tests for the service layer (see TESTING.md)
frontend/                React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui
TaskManagement.slnx      Solution file
PLAN.md                  Original design plan and requirement checklist
TESTING.md               Unit test suite, coverage report, and how to regenerate it
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (or a newer SDK that can still target `net8.0` — confirm with `dotnet --list-sdks` / `dotnet --list-runtimes`; the `Microsoft.AspNetCore.App 8.0.x` and `Microsoft.NETCore.App 8.0.x` runtimes must be present)
- SQL Server reachable from your machine — either:
  - a local SQL Server instance (Developer/Express edition) running on `localhost`, or
  - SQL Server LocalDB (ships with Visual Studio), or
  - SQL Server in Docker (`docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest`)
- [Node.js 20+](https://nodejs.org/) and npm (for the React front-end)

## 1. Backend setup (`TaskManagementAPI/`)

### 1.1 Configure the database connection

The connection string lives in `TaskManagementAPI/appsettings.json` under `ConnectionStrings:DefaultConnection`. It currently points at a local SQL Server instance with Windows/Trusted authentication:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=TaskManagementDb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

Adjust it to match your environment, for example:

| Setup | Connection string |
|---|---|
| Local SQL Server, Windows auth (default above) | `Server=localhost;Database=TaskManagementDb;Trusted_Connection=True;TrustServerCertificate=True;` |
| SQL Server LocalDB | `Server=(localdb)\mssqllocaldb;Database=TaskManagementDb;Trusted_Connection=True;MultipleActiveResultSets=true` |
| SQL Server in Docker (SQL auth) | `Server=localhost,1433;Database=TaskManagementDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;` |

For local development it's fine to edit `appsettings.json` directly, or override it without editing the file via a `.NET user-secret`:
```bash
cd TaskManagementAPI
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your connection string>"
```

The `Jwt:Secret` value in the same file is a **development-only** placeholder — replace it (or override via user-secrets the same way) before deploying anywhere real. It must be at least 32 bytes long; the app fails fast at startup with a clear error if it's missing or too short.

### 1.2 Install the EF Core CLI tool (first time only)

The repo already has a local tool manifest (`TaskManagementAPI/dotnet-tools.json`) pinning `dotnet-ef`. Restore it with:

```bash
cd TaskManagementAPI
dotnet tool restore
```

### 1.3 Apply migrations and seed the database

```bash
cd TaskManagementAPI
dotnet tool run dotnet-ef database update
```

This creates the `TaskManagementDb` database (if it doesn't exist), creates the `Tasks` and `Users` tables, and seeds:
- **10 sample tasks** across all status/priority combinations
- **1 demo user** for logging in:
  - Email: `demo@example.com`
  - Password: `Password123!`

Re-running `dotnet tool run dotnet-ef database update` is safe/idempotent — EF Core tracks applied migrations in the `__EFMigrationsHistory` table.

### 1.4 Run the API

```bash
cd TaskManagementAPI
dotnet run
```

By default this listens on `http://localhost:5263` and `https://localhost:7169` (see `Properties/launchSettings.json`). Swagger UI is available at `/swagger` in Development mode and lets you authenticate with a bearer token (click **Authorize**, paste the token returned from `/api/auth/login`) to try the protected task endpoints directly.

### 1.5 API endpoints

| Verb | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | none | `{ email, password }` → creates a user, returns a JWT |
| POST | `/api/auth/login` | none | `{ email, password }` → returns a JWT |
| GET | `/api/tasks?status=&priority=&search=&page=&pageSize=` | bearer token | server-side filtering (status/priority), search (title or assignee, case-insensitive), and pagination — returns `{ items, page, pageSize, totalCount, totalPages }` |
| GET | `/api/tasks/summary` | bearer token | raw-SQL grouped count by status + priority |
| GET | `/api/tasks/{id}` | bearer token | 404 if not found or soft-deleted |
| POST | `/api/tasks` | bearer token | create a task |
| PUT | `/api/tasks/{id}` | bearer token | full update |
| DELETE | `/api/tasks/{id}` | bearer token | soft-delete (sets `IsDeleted = true`) |

`Status` values: `ToDo`, `InProgress`, `Done`. `Priority` values: `Low`, `Medium`, `High`, `Critical`. `page` defaults to 1, `pageSize` defaults to 10 (max 100). Results are sorted by priority (true severity order — Critical > High > Medium > Low, not alphabetical) then most-recently-modified first.

Every error response (validation, auth, not-found, unhandled exceptions) uses the same consistent envelope:
```json
{ "success": false, "statusCode": 400, "message": "...", "errors": { "Field": ["..."] }, "traceId": "..." }
```

### 1.6 Quick smoke test (curl)

```bash
# Log in and grab a token
curl -s http://localhost:5263/api/auth/login -X POST -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Password123!"}'

# Use the token to list tasks
curl -s http://localhost:5263/api/tasks -H "Authorization: Bearer <token>"
```

## 2. Frontend setup (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

This starts the Vite dev server, normally at `http://localhost:5173` (Vite auto-increments to 5174/5175 if that port is busy — the API's CORS policy already allows all three).

Configure the API base URL via a `.env` file in `frontend/` (copy `.env.example`):

```
VITE_API_URL=http://localhost:5263
```

Adjust this to match whichever URL/port the API is actually listening on from step 1.4.

### 2.1 What's in the frontend

- **Auth**: `/login` and `/signup` pages backed by `POST /api/auth/login` / `/register`. The JWT is stored client-side and attached to every API request via an axios interceptor; an expired/invalid token automatically redirects back to `/login`.
- **Tasks page** (`/`, behind a `ProtectedRoute`): a top nav with a user menu (email + logout), and two views:
  - **List** — a table with an inline status dropdown (calls `PUT` immediately), priority badges, client-side column sorting (click a header to sort/reverse), a debounced search box (waits 400ms after you stop typing before hitting the server), status/priority filters, and server-side pagination (10 rows/page) via the API's `GET /api/tasks?status=&priority=&search=&page=&pageSize=`. Changing a filter or the search term resets back to page 1.
  - **Board** — a Kanban layout grouped by status (`To Do` / `In Progress` / `Done`); it requests a single large page so every task is visible grouped by column rather than paged.
- Both views share the same create/edit dialog (`POST`/`PUT /api/tasks`) and a confirmation dialog before delete (`DELETE /api/tasks/{id}`, soft-delete).
- Every action (create, update, status change, delete, login, signup, logout) shows a toast notification confirming success or explaining the failure.
- Built with [shadcn/ui](https://ui.shadcn.com) components (Radix primitives + Tailwind v4) — see `frontend/components.json` and `frontend/src/components/ui/`. To add more components: `npx shadcn@latest add <component>` from inside `frontend/`.

### 2.2 Frontend structure

```
frontend/src/
  api/            axios client + typed calls (auth.ts, tasks.ts)
  auth/           AuthContext, useAuth hook, ProtectedRoute
  components/     app-level components (TaskListView, TaskBoard, TaskFormModal, PageHeader, ...)
  components/ui/  shadcn/ui primitives (button, dialog, select, table, sonner, ...)
  hooks/          useTasks — fetch/create/update/delete with loading & error state
  lib/            utils.ts (cn helper), apiError.ts (maps API errors to display messages)
  pages/          LoginPage, SignupPage, TasksPage
  types/          Task/TaskStatus/TaskPriority and Auth request/response types matching the API DTOs
```

## 3. Running both together

1. Start the API (`dotnet run` in `TaskManagementAPI/`) — leave it running.
2. Start the front-end (`npm run dev` in `frontend/`) — leave it running.
3. Open the printed Vite URL (e.g. `http://localhost:5173`) in a browser.
4. Log in with `demo@example.com` / `Password123!`, or sign up a new account.

## Running EF Core migrations after a model change

```bash
cd TaskManagementAPI
dotnet tool run dotnet-ef migrations add <MigrationName> -o Data/Migrations
dotnet tool run dotnet-ef database update
```

## Troubleshooting

- **`Jwt:Secret is not configured` / too short** — make sure `appsettings.json` (or a user-secret / environment variable override) has a `Jwt:Secret` of at least 32 bytes.
- **Cannot connect to SQL Server** — verify the server is running and reachable, and that the connection string's auth mode (Windows `Trusted_Connection` vs. SQL `User Id`/`Password`) matches how your SQL Server instance is configured.
- **CORS errors in the browser** — the API allows `http://localhost:5173`, `5174`, and `5175` by default (see the CORS policy in `Program.cs`); update it if the front-end runs on a different port. Also make sure `app.UseCors(...)` is registered before `app.UseHttpsRedirection()` — a CORS preflight that hits the HTTPS redirect first will fail even with a correct policy.
- **401 on every request from the frontend** — check that `frontend/.env`'s `VITE_API_URL` points at the port the API actually printed on startup, and that you're logged in (an expired token auto-redirects to `/login`).
