import { cn } from "@/lib/cn";
import { STATUS_LABELS, type TaskStatus } from "@/types/task";

const STATUS_STYLES: Record<TaskStatus, { pill: string; dot: string }> = {
  ToDo: { pill: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  InProgress: { pill: "bg-sky-50 text-sky-600", dot: "bg-sky-500" },
  Done: { pill: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
};

interface StatusPillProps {
  status: TaskStatus;
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
      {STATUS_LABELS[status]}
    </span>
  );
}
