import { cn } from "@/lib/cn";
import type { TaskPriority } from "@/types/task";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Low: "bg-indigo-50 text-indigo-600",
  Medium: "bg-amber-50 text-amber-600",
  High: "bg-orange-50 text-orange-600",
  Critical: "bg-rose-50 text-rose-600",
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}
