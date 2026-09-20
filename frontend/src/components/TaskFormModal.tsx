import { useEffect, useState, type FormEvent } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useUsers } from "@/hooks/useUsers";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiError";
import { STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskFormValues } from "@/types/task";

function emptyValues(defaultAssigneeId: number): TaskFormValues {
  return {
    title: "",
    description: "",
    status: "ToDo",
    priority: "Medium",
    assignedToUserId: defaultAssigneeId,
  };
}

interface TaskFormModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export function TaskFormModal({ task, open, onOpenChange, onSubmit }: TaskFormModalProps) {
  const { users } = useUsers();
  const [values, setValues] = useState<TaskFormValues>(() => emptyValues(0));
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
        assignedToUserId: task.assignedToUserId,
        rowVersion: task.rowVersion,
      });
    } else {
      setValues(emptyValues(users[0]?.id ?? 0));
    }
    setError(null);
    setFieldErrors({});
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [task, open, users]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) {
      setFieldErrors({ Title: ["Title is required."] });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...values, title: trimmedTitle });
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
              <RichTextEditor
                id="description"
                placeholder="Add any useful context, links, or acceptance criteria…"
                value={values.description}
                onChange={(html) => setValues((v) => ({ ...v, description: html }))}
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

            <Field data-invalid={Boolean(fieldErrors.AssignedToUserId)}>
              <FieldLabel htmlFor="assignedToUserId">Assigned to</FieldLabel>
              <Select
                value={values.assignedToUserId ? String(values.assignedToUserId) : ""}
                onValueChange={(v) => setValues((prev) => ({ ...prev, assignedToUserId: Number(v) }))}
              >
                <SelectTrigger id="assignedToUserId" className="w-full" aria-invalid={Boolean(fieldErrors.AssignedToUserId)}>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={fieldErrors.AssignedToUserId?.map((message) => ({ message }))} />
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
