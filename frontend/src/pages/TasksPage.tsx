import { useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, type TabId } from "@/components/PageHeader";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskListView } from "@/components/TaskListView";
import { TaskPagination } from "@/components/TaskPagination";
import { TaskToolbar } from "@/components/TaskToolbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTasks } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { sortTasks, type SortKey } from "@/lib/taskSort";
import { STATUS_LABELS, type Task, type TaskFormValues, type TaskPriority, type TaskStatus } from "@/types/task";

const PAGE_SIZE = 10;
// The Board view groups everything by status rather than paging through it, so it
// asks for a much larger page instead of a real second page of results.
const BOARD_PAGE_SIZE = 500;
const SEARCH_DEBOUNCE_MS = 400;

export function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabId>("list");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const [sortKey, setSortKey] = useState<SortKey>("modifiedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const { users } = useUsers();

  const filter = useMemo(
    () => ({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      assignedToUserId: assigneeFilter || undefined,
      search: debouncedSearch || undefined,
      page: activeTab === "board" ? 1 : page,
      pageSize: activeTab === "board" ? BOARD_PAGE_SIZE : PAGE_SIZE,
    }),
    [statusFilter, priorityFilter, assigneeFilter, debouncedSearch, page, activeTab],
  );

  const { tasks, totalCount, totalPages, isLoading, isFetching, error, createTask, updateTask, removeTask, refetch } =
    useTasks(filter);

  // A 409 means someone else changed/deleted the task since it was loaded — refresh so the
  // user sees the current state instead of continuing to act on stale data.
  function handleConflict(err: unknown, action: string) {
    if (isAxiosError(err) && err.response?.status === 409) {
      toast.error("Couldn't " + action, {
        description: "This task was changed by someone else. The list has been refreshed.",
      });
      refetch();
      return true;
    }
    return false;
  }

  const sortedTasks = useMemo(() => sortTasks(tasks, sortKey, sortDirection), [tasks, sortKey, sortDirection]);

  function handleSortChange(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  // Any change to status, priority, or search invalidates the current page —
  // jump back to page 1 so the user isn't stranded on a now out-of-range page.
  function handleStatusFilterChange(value: TaskStatus | "") {
    setStatusFilter(value);
    setPage(1);
  }

  function handlePriorityFilterChange(value: TaskPriority | "") {
    setPriorityFilter(value);
    setPage(1);
  }

  function handleAssigneeFilterChange(value: number | "") {
    setAssigneeFilter(value);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreateModal() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  async function handleCreate(values: TaskFormValues) {
    try {
      await createTask(values);
      toast.success("Task created", { description: values.title });
    } catch (err) {
      toast.error("Couldn't create task", { description: getApiErrorMessage(err) });
      throw err;
    }
  }

  async function handleUpdate(values: TaskFormValues) {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, values);
      toast.success("Task updated", { description: values.title });
    } catch (err) {
      if (!handleConflict(err, "update task")) {
        toast.error("Couldn't update task", { description: getApiErrorMessage(err) });
      }
      throw err;
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description ?? "",
        status,
        priority: task.priority,
        assignedToUserId: task.assignedToUserId,
        rowVersion: task.rowVersion,
      });
      toast.success(`Marked as ${STATUS_LABELS[status]}`, { description: task.title });
    } catch (err) {
      if (!handleConflict(err, "update status")) {
        toast.error("Couldn't update status", { description: getApiErrorMessage(err) });
      }
    }
  }

  async function handleConfirmDelete() {
    // A ref (not just the `isDeleting` state) guards against a fast double-click
    // firing two DELETE requests before the disabled state has re-rendered.
    if (!taskPendingDelete || isDeletingRef.current) return;
    isDeletingRef.current = true;
    setIsDeleting(true);
    try {
      await removeTask(taskPendingDelete.id, taskPendingDelete.rowVersion);
      toast.success("Task deleted", { description: taskPendingDelete.title });
      setTaskPendingDelete(null);
    } catch (err) {
      if (!handleConflict(err, "delete task")) {
        toast.error("Couldn't delete task", { description: getApiErrorMessage(err) });
      }
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="px-6 py-6 sm:px-8">
        <TaskToolbar
          search={search}
          onSearchChange={handleSearchChange}
          status={statusFilter}
          onStatusChange={handleStatusFilterChange}
          priority={priorityFilter}
          onPriorityChange={handlePriorityFilterChange}
          assignee={assigneeFilter}
          onAssigneeChange={handleAssigneeFilterChange}
          users={users}
          onNewTask={openCreateModal}
          isFetching={isFetching && !isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Couldn&apos;t load tasks</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            {activeTab === "board" ? (
              <TaskBoard tasks={sortedTasks} onEdit={openEditModal} onDelete={setTaskPendingDelete} />
            ) : (
              <>
                <TaskListView
                  tasks={sortedTasks}
                  onStatusChange={handleStatusChange}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  onEdit={openEditModal}
                  onDelete={setTaskPendingDelete}
                  onNewTask={openCreateModal}
                />
                <TaskPagination
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        )}
      </main>

      <TaskFormModal
        task={editingTask}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={editingTask ? handleUpdate : handleCreate}
      />

      <AlertDialog open={taskPendingDelete !== null} onOpenChange={(open) => !open && setTaskPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{taskPendingDelete?.title}&quot;. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleConfirmDelete}>
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
