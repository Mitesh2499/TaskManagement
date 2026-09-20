import { MoreHorizontal, Plus } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { cn } from "@/lib/cn";
import type { Column } from "@/types/task";

interface BoardColumnProps {
  column: Column;
}

export function BoardColumn({ column }: BoardColumnProps) {
  return (
    <div className="flex w-80 shrink-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", column.dotColorClass)} />
          <h2 className="text-sm font-semibold text-gray-800">{column.title}</h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-600">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Add task"
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Column options"
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-gray-50/60 p-2">
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
