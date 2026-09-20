import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { PriorityBadge } from "@/components/PriorityBadge";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            aria-label="Edit task"
            onClick={() => onEdit(task)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Delete task"
            onClick={() => onDelete(task)}
            className="rounded-md p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900">{task.title}</h3>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{task.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={task.assignedTo} />
          <span className="text-xs text-gray-500">{task.assignedTo}</span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(task.modifiedDate).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
