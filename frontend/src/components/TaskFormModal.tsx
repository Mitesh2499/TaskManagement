import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiError";
import { STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskFormValues } from "@/types/task";

const EMPTY_VALUES: TaskFormValues = {
  title: "",
  description: "",
  status: "ToDo",
  priority: "Medium",
  assignedTo: "",
};

interface TaskFormModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export function TaskFormModal({ task, onClose, onSubmit }: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       Resetting the form to match the task passed in (or a blank form) whenever it
       changes is the "adjust state when a prop changes" case React's docs call out. */
    if (task) {
      setValues({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
      });
    } else {
      setValues(EMPTY_VALUES);
    }
    setError(null);
    setFieldErrors({});
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [task]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setFieldErrors(getApiFieldErrors(err) ?? {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {task ? "Edit task" : "New task"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {error && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Title</span>
            <input
              required
              maxLength={200}
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            {fieldErrors.Title && (
              <span className="text-xs text-rose-500">{fieldErrors.Title[0]}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Description</span>
            <textarea
              maxLength={2000}
              rows={3}
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Status</span>
              <select
                value={values.status}
                onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as typeof v.status }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Priority</span>
              <select
                value={values.priority}
                onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value as typeof v.priority }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Assigned to</span>
            <input
              required
              maxLength={100}
              value={values.assignedTo}
              onChange={(e) => setValues((v) => ({ ...v, assignedTo: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              placeholder="Full name"
            />
            {fieldErrors.AssignedTo && (
              <span className="text-xs text-rose-500">{fieldErrors.AssignedTo[0]}</span>
            )}
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
