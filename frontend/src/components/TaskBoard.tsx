import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { BoardColumn } from "@/components/BoardColumn";
import { TaskCard } from "@/components/TaskCard";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/types/task";

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export function TaskBoard({ tasks, onEdit, onDelete, onStatusChange }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Requiring a small pointer-move distance before a drag "activates" is what lets the
  // same card stay a normal click target (navigate to the detail page) — a plain click
  // never travels far enough to cross the threshold.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(tasks.find((task) => task.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const targetStatus = event.over?.id as TaskStatus | undefined;
    const task = tasks.find((t) => t.id === event.active.id);
    if (task && targetStatus && task.status !== targetStatus) {
      onStatusChange(task, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div
        className="grid gap-5 pb-6"
        style={{
          gridTemplateColumns: `repeat(${Math.min(TASK_STATUSES.length, 3)}, minmax(0, 1fr))`,
        }}
      >
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

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} onEdit={onEdit} onDelete={onDelete} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
