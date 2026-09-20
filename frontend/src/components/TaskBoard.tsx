import { BoardColumn } from "@/components/BoardColumn";
import { STATUS_LABELS, type Task, type TaskStatus } from "@/types/task";

const COLUMNS: { status: TaskStatus; dotColorClass: string }[] = [
  { status: "ToDo", dotColorClass: "bg-amber-500" },
  { status: "InProgress", dotColorClass: "bg-sky-500" },
  { status: "Done", dotColorClass: "bg-emerald-500" },
];

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskBoard({ tasks, onEdit, onDelete }: TaskBoardProps) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-6">
      {COLUMNS.map(({ status, dotColorClass }) => (
        <BoardColumn
          key={status}
          title={STATUS_LABELS[status]}
          dotColorClass={dotColorClass}
          tasks={tasks.filter((task) => task.status === status)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
