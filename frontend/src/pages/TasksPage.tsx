import { useMemo, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, type TabId } from "@/components/PageHeader";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskListView } from "@/components/TaskListView";
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
import { useTasks } from "@/hooks/useTasks";
import { getApiErrorMessage } from "@/lib/apiError";
import { STATUS_LABELS, type Task, type TaskFormValues, type TaskPriority, type TaskStatus } from "@/types/task";

export function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabId>("list");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filter = useMemo(
    () => ({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    }),
    [statusFilter, priorityFilter],
  );

  const { tasks, isLoading, error, createTask, updateTask, removeTask } = useTasks(filter);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(term) ||
        task.assignedTo.toLowerCase().includes(term),
    );
  }, [tasks, search]);

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
      toast.error("Couldn't update task", { description: getApiErrorMessage(err) });
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
        assignedTo: task.assignedTo,
      });
      toast.success(`Marked as ${STATUS_LABELS[status]}`, { description: task.title });
    } catch (err) {
      toast.error("Couldn't update status", { description: getApiErrorMessage(err) });
    }
  }

  async function handleConfirmDelete() {
    if (!taskPendingDelete) return;
    setIsDeleting(true);
    try {
      await removeTask(taskPendingDelete.id);
      toast.success("Task deleted", { description: taskPendingDelete.title });
      setTaskPendingDelete(null);
    } catch (err) {
      toast.error("Couldn't delete task", { description: getApiErrorMessage(err) });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="px-6 py-6 sm:px-8">
        <TaskToolbar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          onNewTask={openCreateModal}
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
        ) : activeTab === "board" ? (
          <TaskBoard tasks={visibleTasks} onEdit={openEditModal} onDelete={setTaskPendingDelete} />
        ) : (
          <TaskListView
            tasks={visibleTasks}
            onStatusChange={handleStatusChange}
            onEdit={openEditModal}
            onDelete={setTaskPendingDelete}
            onNewTask={openCreateModal}
          />
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
