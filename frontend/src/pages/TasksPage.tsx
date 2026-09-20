import { useMemo, useState } from "react";
import { PageHeader, type TabId } from "@/components/PageHeader";
import { TaskBoard } from "@/components/TaskBoard";
import { TaskFormModal } from "@/components/TaskFormModal";
import { TaskListView } from "@/components/TaskListView";
import { TaskToolbar } from "@/components/TaskToolbar";
import { useTasks } from "@/hooks/useTasks";
import { getApiErrorMessage } from "@/lib/apiError";
import type { Task, TaskFormValues, TaskPriority, TaskStatus } from "@/types/task";

export function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabId>("list");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");
  const [search, setSearch] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function handleCreate(values: TaskFormValues) {
    await createTask(values);
  }

  async function handleUpdate(values: TaskFormValues) {
    if (!editingTask) return;
    await updateTask(editingTask.id, values);
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    setActionError(null);
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description ?? "",
        status,
        priority: task.priority,
        assignedTo: task.assignedTo,
      });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) {
      return;
    }
    setActionError(null);
    try {
      await removeTask(task.id);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  }

  const isModalOpen = isCreating || editingTask !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="px-6 py-6 sm:px-8">
        <TaskToolbar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          onNewTask={() => setIsCreating(true)}
        />

        {actionError && (
          <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <p className="py-16 text-center text-sm text-gray-400">Loading tasks…</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-600">
            {error}
          </div>
        ) : activeTab === "board" ? (
          <TaskBoard tasks={visibleTasks} onEdit={setEditingTask} onDelete={handleDelete} />
        ) : (
          <TaskListView
            tasks={visibleTasks}
            onStatusChange={handleStatusChange}
            onEdit={setEditingTask}
            onDelete={handleDelete}
          />
        )}
      </main>

      {isModalOpen && (
        <TaskFormModal
          task={editingTask}
          onClose={() => {
            setEditingTask(null);
            setIsCreating(false);
          }}
          onSubmit={editingTask ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}
