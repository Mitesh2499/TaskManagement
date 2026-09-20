import { Flag, Link2, ListChecks, MessageSquare, MoreHorizontal } from "lucide-react";
import { AvatarGroup } from "@/components/AvatarGroup";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusPill } from "@/components/StatusPill";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <StatusPill status={task.statusLabel} />
        <button
          type="button"
          aria-label="Task options"
          className="rounded-md p-1 text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-gray-900">{task.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{task.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Assignees :</span>
        <AvatarGroup assignees={task.assignees} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Flag className="h-3.5 w-3.5 text-gray-400" />
          {task.dueDate}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {task.commentCount} Comments
        </span>
        <span className="flex items-center gap-1">
          <Link2 className="h-3.5 w-3.5" />
          {task.linkCount} Links
        </span>
        <span className="flex items-center gap-1">
          <ListChecks className="h-3.5 w-3.5" />
          {task.checklistDone}/{task.checklistTotal}
        </span>
      </div>
    </div>
  );
}
