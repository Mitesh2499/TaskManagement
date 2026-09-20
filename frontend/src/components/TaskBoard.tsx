import { BoardColumn } from "@/components/BoardColumn";
import type { Column } from "@/types/task";

interface TaskBoardProps {
  columns: Column[];
}

export function TaskBoard({ columns }: TaskBoardProps) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-6">
      {columns.map((column) => (
        <BoardColumn key={column.id} column={column} />
      ))}
    </div>
  );
}
