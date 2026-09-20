import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BoardColumn } from "@/components/BoardColumn";
import { TaskCard } from "@/components/TaskCard";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/types/task";

type ColumnItems = Record<TaskStatus, Task[]>;

function groupByStatus(tasks: Task[]): ColumnItems {
  const groups = Object.fromEntries(TASK_STATUSES.map((status) => [status, [] as Task[]])) as ColumnItems;
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  return groups;
}

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export function TaskBoard({ tasks, onEdit, onDelete, onStatusChange }: TaskBoardProps) {
  const [items, setItems] = useState<ColumnItems>(() => groupByStatus(tasks));
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Tracks whether a drag gesture is in flight, separately from `activeTask` state — this lets
  // the sync effect below tell "the drag just ended" apart from "a background refetch landed
  // mid-drag", so it never fights the live reordering a drag is producing.
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setItems(groupByStatus(tasks));
  }, [tasks]);

  // Requiring a small pointer-move distance before a drag "activates" is what lets the
  // same card stay a normal click target (navigate to the detail page) — a plain click
  // never travels far enough to cross the threshold.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function findContainer(id: UniqueIdentifier): TaskStatus | undefined {
    if (TASK_STATUSES.includes(id as TaskStatus)) return id as TaskStatus;
    return TASK_STATUSES.find((status) => items[status].some((task) => task.id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    isDraggingRef.current = true;
    setActiveTask(tasks.find((task) => task.id === event.active.id) ?? null);
  }

  // Moves the card between columns live as it's dragged over one — this is what makes the
  // target column reflow and open up a gap before the card is actually dropped.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((task) => task.id === active.id);
      if (activeIndex === -1) return prev;
      const overIndex = overItems.findIndex((task) => task.id === over.id);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...prev,
        [activeContainer]: activeItems.filter((task) => task.id !== active.id),
        [overContainer]: [...overItems.slice(0, newIndex), activeItems[activeIndex], ...overItems.slice(newIndex)],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    isDraggingRef.current = false;
    const draggedTask = activeTask;
    setActiveTask(null);

    const { active, over } = event;
    if (!over || !draggedTask) return;

    const container = findContainer(active.id);
    if (!container) return;

    if (active.id !== over.id) {
      setItems((prev) => {
        const containerItems = prev[container];
        const oldIndex = containerItems.findIndex((task) => task.id === active.id);
        const newIndex = containerItems.findIndex((task) => task.id === over.id);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        return { ...prev, [container]: arrayMove(containerItems, oldIndex, newIndex) };
      });
    }

    if (draggedTask.status !== container) {
      onStatusChange(draggedTask, container);
    }
  }

  function handleDragCancel() {
    isDraggingRef.current = false;
    setActiveTask(null);
    setItems(groupByStatus(tasks));
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="grid gap-5 pb-6"
        style={{
          gridTemplateColumns: `repeat(${Math.min(TASK_STATUSES.length, 3)}, minmax(0, 1fr))`,
        }}
      >
        {TASK_STATUSES.map((status) => (
          <BoardColumn key={status} status={status} tasks={items[status]} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} onEdit={onEdit} onDelete={onDelete} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
