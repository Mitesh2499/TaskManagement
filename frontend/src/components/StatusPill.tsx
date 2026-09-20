import { cn } from "@/lib/cn";
import type { TaskStatusLabel } from "@/types/task";

const STATUS_STYLES: Record<TaskStatusLabel, { pill: string; dot: string }> = {
  "Not Started": { pill: "bg-violet-50 text-violet-600", dot: "bg-violet-500" },
  "In Research": { pill: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  "On Track": { pill: "bg-pink-50 text-pink-600", dot: "bg-pink-500" },
  "At Risk": { pill: "bg-red-50 text-red-600", dot: "bg-red-500" },
  Complete: { pill: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
};

interface StatusPillProps {
  status: TaskStatusLabel;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles.pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {status}
    </span>
  );
}
