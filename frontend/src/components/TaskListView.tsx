import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusSelect } from "@/components/StatusSelect";
import type { Task, TaskStatus } from "@/types/task";

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TaskListView({ tasks, onStatusChange, onEdit, onDelete }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white py-24 text-center">
        <p className="text-sm font-medium text-gray-700">No tasks found</p>
        <p className="text-sm text-gray-400">Try adjusting your filters or create a new task.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Assigned To</th>
            <th className="px-4 py-3 font-medium">Modified</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <tr key={task.id} className="group hover:bg-gray-50">
              <td className="max-w-xs px-4 py-3 align-top">
                <p className="font-medium text-gray-900">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{task.description}</p>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <StatusSelect
                  value={task.status}
                  onChange={(status) => onStatusChange(task, status)}
                />
              </td>
              <td className="px-4 py-3 align-top">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignedTo} />
                  <span className="text-gray-700">{task.assignedTo}</span>
                </div>
              </td>
              <td className="px-4 py-3 align-top text-gray-500">{formatDate(task.modifiedDate)}</td>
              <td className="px-4 py-3 align-top">
                <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Edit task"
                    onClick={() => onEdit(task)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete task"
                    onClick={() => onDelete(task)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
