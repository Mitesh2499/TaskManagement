import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "@/components/TaskCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type Task, type TaskStatus } from "@/types/task";

const STATUS_DOT_STYLES: Record<TaskStatus, string> = {
  ToDo: "bg-status-todo-foreground",
  InProgress: "bg-status-in-progress-foreground",
  Done: "bg-status-done-foreground",
};

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function BoardColumn({ status, tasks, onEdit, onDelete }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className={cn("size-2 rounded-full", STATUS_DOT_STYLES[status])} />
        <h2 className="text-sm font-semibold text-foreground">{STATUS_LABELS[status]}</h2>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-col gap-3 rounded-xl bg-muted/40 p-2 outline-2 outline-offset-2 outline-transparent transition-colors",
          isOver && "bg-muted outline-primary/40",
        )}
      >
        {tasks.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}
