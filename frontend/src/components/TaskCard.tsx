import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const navigate = useNavigate();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/tasks/${task.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/tasks/${task.id}`);
      }}
      className="cursor-pointer rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition hover:shadow-md"
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
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
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
