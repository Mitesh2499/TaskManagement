import { useEffect, useState, type FormEvent } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export function TaskFormModal({ task, open, onOpenChange, onSubmit }: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect --
       Resetting the form to match the task passed in (or a blank form) whenever the
       dialog opens is the "adjust state when a prop changes" case React's docs call out. */
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
  }, [task, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setFieldErrors(getApiFieldErrors(err) ?? {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            <Field data-invalid={Boolean(fieldErrors.Title)}>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="title"
                  required
                  maxLength={200}
                  placeholder="e.g. Design the homepage wireframe"
                  value={values.title}
                  onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.Title)}
                />
              </InputGroup>
              <FieldError errors={fieldErrors.Title?.map((message) => ({ message }))} />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                maxLength={2000}
                rows={3}
                placeholder="Add any useful context, links, or acceptance criteria…"
                value={values.description}
                onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={values.status}
                  onValueChange={(v) => setValues((prev) => ({ ...prev, status: v as typeof prev.status }))}
                >
                  <SelectTrigger className="w-full">
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
              </Field>

              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  value={values.priority}
                  onValueChange={(v) => setValues((prev) => ({ ...prev, priority: v as typeof prev.priority }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TASK_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field data-invalid={Boolean(fieldErrors.AssignedTo)}>
              <FieldLabel htmlFor="assignedTo">Assigned to</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="assignedTo"
                  required
                  maxLength={100}
                  placeholder="e.g. Priya Nair"
                  value={values.assignedTo}
                  onChange={(e) => setValues((v) => ({ ...v, assignedTo: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.AssignedTo)}
                />
              </InputGroup>
              <FieldError errors={fieldErrors.AssignedTo?.map((message) => ({ message }))} />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              {isSubmitting ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
