import { TaskCard } from "@/components/TaskCard";
import { cn } from "@/lib/cn";
import type { Task } from "@/types/task";

interface BoardColumnProps {
  title: string;
  dotColorClass: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function BoardColumn({ title, dotColorClass, tasks, onEdit, onDelete }: BoardColumnProps) {
  return (
    <div className="flex w-80 shrink-0 flex-col">
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className={cn("h-2 w-2 rounded-full", dotColorClass)} />
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-600">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-gray-50/60 p-2">
        {tasks.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-gray-400">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
