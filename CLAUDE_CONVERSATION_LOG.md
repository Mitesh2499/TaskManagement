# Claude Code Conversation Log

This document summarizes the Claude Code session used to build this Task Management application, as required by the take-home challenge deliverables. It captures what was asked at each step and how the assistant responded, in chronological order. It is a summary of the actual conversation, not a verbatim transcript.

## 1. Planning

**Asked:** Write a plan document for a v1 backend + frontend based on the take-home spec, adding packages as needed but planning first.

**Done:** Created `PLAN.md` covering the .NET 8 Web API design (entities, endpoints, validation, exception handling), the SQL Server schema and seed strategy, the React front-end approach, and a requirement-to-implementation checklist mapped to the original challenge spec.

**Asked (follow-up):** Add email/password authentication and treat it as core scope, not a bonus — update the plan.

**Done:** Revised `PLAN.md` to move JWT auth (register/login, BCrypt hashing) into the required feature set, and outlined the auth flow (token issuance, protected endpoints, frontend token storage).

## 2. Backend implementation

**Asked:** "Do it — let's first focus on backend."

**Done:** Implemented the full .NET 8 Web API:
- EF Core Code-First models (`TaskItem`, `User`), enums (`TaskState`, `TaskPriority`)
- `AppDbContext` with a soft-delete global query filter, timestamp auto-stamping on save
- `TaskService` with the required LINQ filter/sort query, and a raw-SQL grouped summary query (`GET /api/tasks/summary`) satisfying the "at least one raw SQL query" requirement
- JWT auth (`AuthService`, `TokenService`) with BCrypt password hashing
- A custom `GlobalExceptionHandler` (.NET 8 `IExceptionHandler`) and a consistent `ApiErrorResponse` envelope for every error case
- Input validation via data annotations plus a custom `ValidEnumAttribute` for friendly enum error messages

## 3. Database setup and documentation

**Asked:** The database connection is configured — migrate and seed the data, and update `README.md` so anyone can set the project up easily.

**Done:** Ran the initial EF Core migration, seeded 10 sample tasks across all status/priority combinations, and wrote the first version of `README.md` with setup steps for both the API and frontend.

## 4. Bug fixes: login error and validation messages

**Asked:** Reported a login 500 error (with a screenshot/error text).

**Done:** Root-caused it to a JWT signing secret that was too short for HS256. Fixed the secret, and added a fail-fast startup check that throws a clear error if `Jwt:Secret` is ever too short again, so the failure mode can't silently return a 500 in the future.

**Asked:** Reported an ugly raw enum-binding validation error and asked for consistent, user-friendly API error responses (`{ success, statusCode, message, errors, traceId }`) with clear per-field messages like "Status is required" / "Invalid status. Allowed values are: ...".

**Done:** Changed `Status`/`Priority` to bind as validated strings instead of raw enums, added the `ValidEnumAttribute` mentioned above, and rebuilt the global exception handler and model-state error factory to always return the same clean envelope — including collapsing malformed/empty JSON body errors into one readable message instead of leaking parser internals.

## 5. Frontend: Kanban UI

**Asked:** "Let's focus on frontend" — build a Kanban board UI matching a reference screenshot, Tailwind only, no sidebar.

**Done:** Built the initial React (Vite + TypeScript) frontend: login/signup pages, a Kanban board grouped by status, task cards with priority color-coding, and a create/edit form.

**Asked:** Improve the UI's visual quality, use a proper shadcn component library, make the card actions menu visible, look more professional, and add toast messages.

**Done:** After the assistant's initial hand-rolled attempt, the user pointed to a real shadcn CLI-driven setup already present in the repo (`frontend/.agents/skills/shadcn/`). The assistant re-did the frontend using the actual shadcn/ui CLI (`npx shadcn@latest init`), migrating all UI primitives (buttons, dialogs, dropdowns, selects, tables, etc.) to shadcn components with semantic Tailwind color tokens, added Sonner for toast notifications, and reworked the board/list views and forms around these primitives.

## 6. Gap analysis and README refresh

**Asked:** "What is missing in current implementation, except Docker?"

**Done:** Audited the codebase against the challenge spec and reported honestly: unit tests and the optional shared class library were missing, and the README no longer matched the real setup steps.

**Asked:** Update the README.

**Done:** Rewrote `README.md` to reflect the actual (shadcn-based) frontend and current API shape.

## 7. Bug fixes: delete error and toast colors

**Asked:** Reported a scary "Task with id 14 was not found" red error toast appearing on delete, and asked for toasts to be color-coded (success green, error red, info blue, warning yellow), plus a layout fix on a second line of text that wasn't visible.

**Done:** Root-caused the delete bug: a duplicate-click race could send two DELETE requests, and the second (a 404) was being surfaced as a scary error even though the end state — task gone — was already correct. Fixed `useTasks` to treat a 404-on-delete as success, added a reentrancy guard against fast double-clicks, enabled Sonner's `richColors` so toast severity is colored automatically, and fixed the toast description styling.

## 8. Loading UX and sorting

**Asked:** Don't show a full loading skeleton on every filter/search change — only on the initial page load or a manual refresh — and add ascending/descending column sorting to the table.

**Done:** Split the tasks hook's loading state into `isLoading` (first load only, shows the skeleton) and `isFetching` (every fetch, shows a subtle inline spinner and dims the table instead of blanking it). Added client-side column sorting with a sortable table header component.

## 9. Pagination, debounced search, and testing

**Asked:** Add server-side pagination with debounced search, write unit tests, measure coverage, and write it all up in a markdown file.

**Done:**
- Backend: added `page`/`pageSize` query parameters, a `PagedResult<T>` response shape, and a case-insensitive `search` filter (title or assignee) using `EF.Functions.Like`.
- Frontend: added a 400ms debounced search box and a pagination control; any filter change resets to page 1.
- Testing: created the `TaskManagementAPI.Tests` xUnit project (EF Core InMemory + Sqlite providers, FluentAssertions), covering the service layer's filtering, sorting, pagination, CRUD, and soft-delete behavior. While writing the ordering test, found and fixed a real bug: priority was stored as a string, so sorting by it was alphabetical ("Medium" > "Low" > "High" > "Critical") instead of true severity order — fixed with a SQL `CASE`-expression ordering and added a regression test for it.
- Set up `dotnet-reportgenerator-globaltool` for coverage, and wrote `TESTING.md` documenting the suite, how to regenerate coverage, and the priority-ordering bug.

**Reported:** A `dotnet build` file-lock error. **Explained:** it was a leftover `dotnet run` process holding the output file, not a code issue — resolved by stopping the stray process (this recurred a few more times later in the session for the same reason, each time resolved the same way, with the user's explicit go-ahead each time before killing a running process).

**Asked:** "Tests aren't running properly — too much variance between runs, fix it."

**Done:** Ran the suite multiple times (including a detailed per-test run) and got 36/36 passing consistently every time with no flakiness. Unable to reproduce any inconsistency, the assistant asked a clarifying question about how the tests were being run — the user declined to answer that question and instead moved directly to the next feature request below, so this report was not pursued further (no bug was ever found).

## 10. Users as assignees, concurrency, task detail page, rich text (requested together, "one by one")

**Asked (single large request, explicitly to be done one step at a time):**
> "Whoever logs in is considered a user, so currently 'Assigned to' is a string but if we make it a dropdown of users it will be more user-friendly — update existing data and seed data accordingly. Add a filter by user. Handle race conditions with a RowVersion for tasks — anyone can update or delete anyone else's task with no restrictions. On click of a card, the page should open with information about that task. Also make description a rich-text field, for create, edit, and viewing (both card and page)."

This was worked through as five sequential deliveries:

**10.1 — Users as assignees + filter.**
Replaced the free-text `AssignedTo` string with a real `User` foreign key (`AssignedToUserId`). Added a `Name` field to `User`, a migration that seeds 5 named users and repoints the 10 sample tasks at them, a `GET /api/users` endpoint, and an "Assigned to" dropdown (create/edit form) and filter (toolbar) on the frontend, replacing the old text input.

**10.2 — Optimistic concurrency (RowVersion).**
Added a SQL Server `rowversion` column to `TaskItem`, wired through EF Core's concurrency-token support (with a provider-conditional configuration, since the InMemory/Sqlite test providers don't support DB-generated rowversion the same way SQL Server does — a real compatibility issue discovered and worked around while writing the corresponding tests). `PUT`/`DELETE` now require the client's last-seen `rowVersion` and return 409 if it's stale, both in the API and reflected in the frontend (a toast explaining the conflict, followed by an automatic refresh instead of a silent overwrite). Verified live against the real SQL Server database via curl (confirmed the actual rowversion bytes bump on update) and with a genuine two-browser-context Playwright test simulating two people editing the same task at once.

**10.3 — Task detail page / click-to-open.**
Added a `/tasks/:id` route and `TaskDetailPage` showing full task info, inline status change, edit/delete, and formatted timestamps. Made both the Kanban card and the list row clickable to navigate there, while keeping the status dropdown and "..." actions menu working without also triggering navigation (event propagation was stopped on those inner controls specifically).

**10.4 — Rich-text description.**
Added a Tiptap-based rich-text editor (bold/italic/strikethrough/lists) for the description field in the create/edit form, and a DOMPurify-sanitized renderer used everywhere the description is displayed (card, list row, detail page). Widened the backend's description column/validation limit to accommodate the extra HTML markup.

*(Between 10.3 and 10.4, the user reported the Kanban board throwing a 400 error on `GET /api/tasks?page=1&pageSize=500`. Root cause: the server capped `pageSize` at 100, but the Board view intentionally requests a single large page to show every task across its columns at once. Fixed by raising the server-side cap to 500.)*

## 11. Team-wide and per-task change log

**Asked:** Also add a "change log" button at the top-right of the board showing history for all tasks, and a change log at the task level too.

**Done:** Added a `TaskAuditLog` table recording every create/update/delete with a human-readable diff (e.g. `Status: ToDo → InProgress; Priority: Low → High`), who made the change, and when — written in the same database transaction as the task change itself. Added `GET /api/tasks/changelog` (team-wide, paginated) and `GET /api/tasks/{id}/changelog` (per task). On the frontend: a **Change log** button opens a dialog listing every change across all tasks (with links to each task), and the task detail page has its own **Activity** section for just that task.

## 12. Kanban drag-and-drop

**Asked:** Board cards should be draggable between To Do / In Progress / Done, Jira-style, changing the task's status on drop.

**Done:** First implementation used native HTML5 drag-and-drop. The user found the visual result unconvincing ("ghost effect" — the dragged card's opacity fading looked like a washed-out duplicate) and asked for the target column to visibly open up space while dragging, like Jira. Rebuilt the whole interaction on [dnd-kit](https://dndkit.com) (`@dnd-kit/core` + `@dnd-kit/sortable`): the original card's slot now becomes an empty dashed-outline placeholder (not a translucent duplicate) while a separate floating "drag overlay" card follows the cursor, and dragging over another column live-reflows its cards to open a gap at the exact drop position, snapping back to server order once the status change is confirmed.

## 13. Avatar color algorithm

**Asked:** Use a string-hashing algorithm for user avatar colors so each name gets a distinct (but slightly randomized-looking) color, while the same name always produces the same color.

**Done:** Replaced a small fixed 7-color palette with an FNV-1a string hash mapped directly onto a full 360° color hue at fixed saturation/lightness — deterministic per name (verified "Mitesh" always resolves to the same hue), while spreading distinct names much more evenly across the color wheel than the old small palette could.

## 14. Edge-case hardening across all forms

**Asked:** Handle edge cases everywhere (from register through the task form) for things like a long garbled string typed into a field.

**Done:**
- Backend: titles and descriptions are now trimmed server-side before saving; register's password is capped at 72 characters (bcrypt silently truncates anything longer, which is a real correctness footgun, not just a cosmetic limit); login email/password got sane length caps too.
- Frontend: long unbroken strings (no spaces) no longer overflow their containers — added word-break handling to task titles, descriptions, and change-log text wherever they're displayed; client-side input length limits now mirror the backend's everywhere (signup/login email & password, search box); the task form trims the title and rejects a whitespace-only one immediately instead of round-tripping to the server.
- Verified live: whitespace-only title, an over-length title, and an over-length password each now return a clean validation error instead of an unclear one or unexpected behavior.

## 15. Documentation

**Asked:** Update the README with the full feature set, and separately, put clear setup instructions for the API and frontend at the very start of the document.

**Done:** Rewrote `README.md`'s feature list and API reference to reflect everything built above (users-as-assignees, concurrency, task detail page, rich text, change log, drag-and-drop board), and added a "Quick start" section immediately after the introduction with a minimal copy-pasteable path to get both the API and frontend running plus the demo login, ahead of the more detailed configuration/reference/troubleshooting sections.

## Working style notes

Throughout the session, changes were verified rather than just asserted: the backend test suite (42 xUnit tests by the end) was run after every backend change, `dotnet build`/`npm run build`/`npm run lint` were run after every change, and non-trivial features (concurrency handling, drag-and-drop, click-to-navigate, validation edge cases) were additionally checked live via curl against the running API and/or in a browser. When a reported problem turned out not to be reproducible (the test-flakiness report in section 9), that was reported honestly rather than "fixed" speculatively.
