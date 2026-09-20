import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { TaskAuditLog } from "@/types/auditLog";

const ACTION_VERB: Record<TaskAuditLog["action"], string> = {
  Created: "created",
  Updated: "updated",
  Deleted: "deleted",
};

interface ChangeLogListProps {
  entries: TaskAuditLog[];
  isLoading: boolean;
  error: string | null;
  showTaskTitle?: boolean;
  emptyMessage?: string;
}

export function ChangeLogList({ entries, isLoading, error, showTaskTitle, emptyMessage }: ChangeLogListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage ?? "No activity yet."}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <Avatar name={entry.changedByName} />
          <div className="min-w-0 flex-1">
            <p className="wrap-break-word text-sm text-foreground">
              <span className="font-medium">{entry.changedByName}</span> {ACTION_VERB[entry.action]}{" "}
              {showTaskTitle ? (
                <button
                  type="button"
                  className="font-medium underline decoration-dotted underline-offset-2 hover:text-primary"
                  onClick={() => navigate(`/tasks/${entry.taskId}`)}
                >
                  {entry.taskTitle}
                </button>
              ) : (
                "this task"
              )}
            </p>
            {entry.action === "Updated" && (
              <p className="mt-0.5 wrap-break-word text-sm text-muted-foreground">{entry.summary}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">{formatRelativeTime(entry.timestamp)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
