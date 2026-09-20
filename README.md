# Task Management App

A full-stack task management system for an internal team: a .NET 8 Web API backed by SQL Server (EF Core, Code First) with JWT email/password authentication, and a React + TypeScript front-end (Vite + Tailwind CSS v4 + shadcn/ui) with a drag-and-drop Kanban board, a sortable/filterable list view, rich-text task descriptions, per-task and team-wide activity history, and optimistic-concurrency-safe editing.

See [PLAN.md](PLAN.md) for the original design plan and requirement-to-implementation mapping, and [TESTING.md](TESTING.md) for the backend unit test suite and coverage report.

## Features

- **Auth** — email/password register & login, JWT bearer tokens, BCrypt password hashing.
- **Tasks** — create, edit, soft-delete, and filter by status, priority, assignee, and free-text search (title or assignee name), with server-side pagination and sorting.
- **Users as assignees** — "Assigned to" is a real user (dropdown, not free text); anyone on the team can view, edit, or reassign any task — there's no ownership lock.
- **Kanban board** — drag a card between To Do / In Progress / Done to change its status (built with [dnd-kit](https://dndkit.com), including live column reflow and a floating drag preview), or use the List view's inline status dropdown.
- **Task detail page** — clicking a card or row opens `/tasks/:id` with the full task, an inline status changer, and its own activity history.
- **Rich-text descriptions** — a Tiptap-based editor (bold/italic/strikethrough/lists) for the description field, sanitized with DOMPurify wherever it's displayed (card, list, detail page).
- **Change log / activity history** — every create, update, and delete is recorded with a human-readable diff (e.g. `Status: ToDo → InProgress; Priority: Low → High`) and who made it. A **Change log** button (top-right of the Tasks page) shows the team-wide history across all tasks; the task detail page shows just that task's history.
- **Optimistic concurrency** — tasks carry a SQL Server `rowversion`. If two people edit or delete the same task at once, the second save is rejected with a clear conflict message and the UI auto-refreshes to the latest version instead of silently overwriting anyone's change.
- **Soft delete** — deleted tasks are hidden, not destroyed (`IsDeleted` flag + an EF Core global query filter).
- **Consistent API error responses**, toast notifications for every action (color-coded by outcome), debounced search, loading vs. background-refresh states, and edge-case input handling (trimmed/whitespace-only titles, long-string wrapping, matching client/server length limits) throughout.

## Project layout

```
TaskManagementAPI/       .NET 8 Web API — EF Core, JWT auth, task CRUD, changelog + summary endpoints
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

This creates the `TaskManagementDb` database (if it doesn't exist), creates the `Tasks`, `Users`, and `TaskAuditLogs` tables, and seeds:
- **5 users** (all sharing the same password below) who show up as assignees in the "Assigned to" dropdown
- **10 sample tasks** across all status/priority combinations, assigned across those users
- A demo login:
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
| POST | `/api/auth/register` | none | `{ name, email, password }` → creates a user, returns a JWT |
| POST | `/api/auth/login` | none | `{ email, password }` → returns a JWT |
| GET | `/api/users` | bearer token | list of team members, for the "Assigned to" dropdown/filter |
| GET | `/api/tasks?status=&priority=&assignedToUserId=&search=&page=&pageSize=` | bearer token | server-side filtering (status/priority/assignee), search (title or assignee, case-insensitive), and pagination — returns `{ items, page, pageSize, totalCount, totalPages }` |
| GET | `/api/tasks/summary` | bearer token | raw-SQL grouped count by status + priority |
| GET | `/api/tasks/changelog?page=&pageSize=` | bearer token | team-wide activity history across every task, newest first |
| GET | `/api/tasks/{id}/changelog?page=&pageSize=` | bearer token | activity history for one task |
| GET | `/api/tasks/{id}` | bearer token | 404 if not found or soft-deleted |
| POST | `/api/tasks` | bearer token | create a task — records a "Created" changelog entry |
| PUT | `/api/tasks/{id}` | bearer token | full update — requires the task's current `rowVersion`; 409 if it's stale (someone else changed it first). Records an "Updated" changelog entry with a diff of what changed |
| DELETE | `/api/tasks/{id}?rowVersion=` | bearer token | soft-delete (sets `IsDeleted = true`); `rowVersion` is optional but subject to the same 409 conflict check when provided. Records a "Deleted" changelog entry |

`Status` values: `ToDo`, `InProgress`, `Done`. `Priority` values: `Low`, `Medium`, `High`, `Critical`. `page` defaults to 1, `pageSize` defaults to 10 (max 500 — the Board view uses a large page size to fetch every task at once for its columns). Results are sorted by priority (true severity order — Critical > High > Medium > Low, not alphabetical) then most-recently-modified first.

Every task response includes a base64 `rowVersion` string; send it back unchanged on `PUT`/`DELETE` so the server can detect concurrent edits.

Every error response (validation, auth, not-found, conflict, unhandled exceptions) uses the same consistent envelope:
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
- **Tasks page** (`/`, behind a `ProtectedRoute`): a top nav with a **Change log** button (team-wide activity history) and a user menu (name/email + logout), and two views:
  - **List** — a table with an inline status dropdown (calls `PUT` immediately), priority badges, client-side column sorting (click a header to sort/reverse), a debounced search box (waits 400ms after you stop typing before hitting the server), status/priority/assignee filters, and server-side pagination (10 rows/page). Changing a filter or the search term resets back to page 1. Clicking a row (outside the status dropdown or actions menu) opens the task detail page.
  - **Board** — a Kanban layout grouped by status (`To Do` / `In Progress` / `Done`); drag a card to a different column to change its status, with live reflow of the target column and a floating drag preview (via dnd-kit). Clicking a card (outside the drag gesture or actions menu) opens the task detail page.
- **Task detail page** (`/tasks/:id`) — full task info, inline status change, edit/delete, and an **Activity** section showing that task's own change history.
- Both the list/board and the detail page share the same create/edit dialog (`POST`/`PUT /api/tasks`), which includes a rich-text editor for the description, and a confirmation dialog before delete (`DELETE /api/tasks/{id}`, soft-delete).
- **Optimistic concurrency in the UI**: every edit/status-change/delete sends the task's `rowVersion`; a 409 response shows a "this was changed by someone else" toast and refreshes to the latest data instead of failing silently or overwriting it.
- Every action (create, update, status change, delete, login, signup, logout) shows a toast notification confirming success or explaining the failure, color-coded by outcome (success/error/info/warning).
- Built with [shadcn/ui](https://ui.shadcn.com) components (Radix primitives + Tailwind v4) — see `frontend/components.json` and `frontend/src/components/ui/`. To add more components: `npx shadcn@latest add <component>` from inside `frontend/`.

### 2.2 Frontend structure

```
frontend/src/
  api/            axios client + typed calls (auth.ts, tasks.ts, users.ts)
  auth/           AuthContext, useAuth hook, ProtectedRoute
  components/     app-level components (TaskListView, TaskBoard, BoardColumn, TaskCard,
                   TaskFormModal, RichTextEditor, RichTextView, ChangeLogDialog, ChangeLogList,
                   PageHeader, ...)
  components/ui/  shadcn/ui primitives (button, dialog, select, table, sonner, toggle, ...)
  hooks/          useTasks, useTask, useUsers, useChangeLog, useDebouncedValue
  lib/            utils.ts (cn helper), apiError.ts, taskSort.ts, formatRelativeTime.ts
  pages/          LoginPage, SignupPage, TasksPage, TaskDetailPage
  types/          Task/TaskStatus/TaskPriority, User, TaskAuditLog, and Auth request/response
                   types matching the API DTOs
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
- **409 Conflict on save/delete** — expected when someone else changed the same task first; the UI shows a toast and refreshes automatically. If scripting against the API directly, re-fetch the task to get its current `rowVersion` and retry.
- **`obj\...\apphost.exe` locked / can't rebuild the API** — a previous `dotnet run` is still holding the file; stop that process (or `Ctrl+C` the terminal it's running in) before rebuilding.
