# Task Management App

A lightweight task management system for an internal team: a .NET 8 Web API backed by SQL Server (EF Core, Code First) with JWT email/password authentication, and a React + TypeScript front-end (Vite + Tailwind).

See [PLAN.md](PLAN.md) for the full design plan and requirement-to-implementation mapping.

## Project layout

```
TaskManagementAPI/   .NET 8 Web API (EF Core, JWT auth, task CRUD + summary endpoint)
frontend/             React + Vite + TypeScript + Tailwind CSS (task board UI)
TaskManagement.slnx   Solution file referencing the API project
PLAN.md               Design plan and requirement checklist
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (or a newer SDK that can still target `net8.0` — confirm with `dotnet --list-sdks` / `dotnet --list-runtimes`, the `Microsoft.AspNetCore.App 8.0.x` and `Microsoft.NETCore.App 8.0.x` runtimes must be present)
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

The `Jwt:Secret` value in the same file is a **development-only** placeholder — replace it (or override via user-secrets the same way) before deploying anywhere real.

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
| GET | `/api/tasks?status=&priority=` | bearer token | optional filtering by status/priority |
| GET | `/api/tasks/summary` | bearer token | raw-SQL grouped count by status + priority |
| GET | `/api/tasks/{id}` | bearer token | 404 if not found or soft-deleted |
| POST | `/api/tasks` | bearer token | create a task |
| PUT | `/api/tasks/{id}` | bearer token | full update |
| DELETE | `/api/tasks/{id}` | bearer token | soft-delete (sets `IsDeleted = true`) |

`Status` values: `ToDo`, `InProgress`, `Done`. `Priority` values: `Low`, `Medium`, `High`, `Critical`.

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

This starts the Vite dev server at `http://localhost:5173`. Configure the API base URL via a `.env` file in `frontend/`:

```
VITE_API_URL=http://localhost:5263
```

(Copy `.env.example` if present, or create `.env` with the line above — it must match whichever URL/port the API is actually listening on from step 1.4.)

> Note: the front-end currently ships as the default Vite + React + Tailwind scaffold. The task board, login/signup pages, and API integration described in [PLAN.md](PLAN.md) are the next implementation phase.

## 3. Running both together

1. Start the API (`dotnet run` in `TaskManagementAPI/`) — leave it running.
2. Start the front-end (`npm run dev` in `frontend/`) — leave it running.
3. Open `http://localhost:5173` in a browser.
4. Log in with `demo@example.com` / `Password123!` (once the login UI is implemented), or exercise the API directly via Swagger/curl in the meantime.

## Running EF Core migrations after a model change

```bash
cd TaskManagementAPI
dotnet tool run dotnet-ef migrations add <MigrationName> -o Data/Migrations
dotnet tool run dotnet-ef database update
```

## Troubleshooting

- **`Jwt:Secret is not configured`** — make sure `appsettings.json` (or a user-secret / environment variable override) has a non-empty `Jwt:Secret`.
- **Cannot connect to SQL Server** — verify the server is running and reachable, and that the connection string's auth mode (Windows `Trusted_Connection` vs. SQL `User Id`/`Password`) matches how your SQL Server instance is configured.
- **CORS errors in the browser** — the API only allows `http://localhost:5173` by default (see `Program.cs`); update the CORS policy if the front-end runs on a different port.
