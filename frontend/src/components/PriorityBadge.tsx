import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/task";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Low: "bg-priority-low text-priority-low-foreground",
  Medium: "bg-priority-medium text-priority-medium-foreground",
  High: "bg-priority-high text-priority-high-foreground",
  Critical: "bg-priority-critical text-priority-critical-foreground",
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return <Badge className={cn(PRIORITY_STYLES[priority], className)}>{priority}</Badge>;
}
