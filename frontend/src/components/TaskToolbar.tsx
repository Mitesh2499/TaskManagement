import { Plus, Search } from "lucide-react";
import { STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/types/task";

interface TaskToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatus | "";
  onStatusChange: (value: TaskStatus | "") => void;
  priority: TaskPriority | "";
  onPriorityChange: (value: TaskPriority | "") => void;
  onNewTask: () => void;
}

export function TaskToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  onNewTask,
}: TaskToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks"
          className="w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TaskStatus | "")}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
      >
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "")}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onNewTask}
        className="ml-auto flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
      >
        <Plus className="h-4 w-4" />
        New Task
      </button>
    </div>
  );
}
