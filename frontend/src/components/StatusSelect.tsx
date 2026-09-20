import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "@/types/task";

const STATUS_SELECT_COLORS: Record<TaskStatus, string> = {
  ToDo: "bg-amber-50 text-amber-700 border-amber-200",
  InProgress: "bg-sky-50 text-sky-700 border-sky-200",
  Done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

export function StatusSelect({ value, onChange, disabled }: StatusSelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_SELECT_COLORS[value]}`}
    >
      {TASK_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
