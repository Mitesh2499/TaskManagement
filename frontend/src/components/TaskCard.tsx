import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RichTextView } from "@/components/RichTextView";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  // Rendered inside <DragOverlay> as the floating "ghost" that follows the pointer —
  // presentational only, so it skips its own drag wiring and click navigation.
  overlay?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, overlay = false }: TaskCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: overlay,
  });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      role={overlay ? undefined : "link"}
      tabIndex={overlay ? undefined : 0}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={overlay ? undefined : () => navigate(`/tasks/${task.id}`)}
      onKeyDown={
        overlay
          ? undefined
          : (e) => {
              if (e.key === "Enter") navigate(`/tasks/${task.id}`);
            }
      }
      className={cn(
        "rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition",
        !overlay && "cursor-grab touch-none hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-40",
        overlay && "rotate-2 cursor-grabbing shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Task actions"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-foreground">{task.title}</h3>
      {task.description && (
        <RichTextView html={task.description} clamp={2} className="mt-1 text-muted-foreground" />
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={task.assignedToName} />
          <span className="text-xs text-muted-foreground">{task.assignedToName}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(task.modifiedDate).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
