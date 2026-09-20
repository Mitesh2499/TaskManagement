import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/types/task";

const STATUS_TRIGGER_STYLES: Record<TaskStatus, string> = {
  ToDo: "bg-status-todo text-status-todo-foreground",
  InProgress: "bg-status-in-progress text-status-in-progress-foreground",
  Done: "bg-status-done text-status-done-foreground",
};

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

export function StatusSelect({ value, onChange, disabled }: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TaskStatus)} disabled={disabled}>
      <SelectTrigger className={cn("w-36 rounded-full border-transparent", STATUS_TRIGGER_STYLES[value])}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {TASK_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
