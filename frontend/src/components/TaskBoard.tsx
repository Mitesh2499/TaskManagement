import { BoardColumn } from "@/components/BoardColumn";
import { TASK_STATUSES, type Task } from "@/types/task";

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskBoard({ tasks, onEdit, onDelete }: TaskBoardProps) {
  return (
    <div
      className="grid gap-5 pb-6"
      style={{
        gridTemplateColumns: `repeat(${Math.min(TASK_STATUSES.length, 3)}, minmax(0, 1fr))`,
      }}
    >
      {" "}
      {TASK_STATUSES.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          tasks={tasks.filter((task) => task.status === status)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
