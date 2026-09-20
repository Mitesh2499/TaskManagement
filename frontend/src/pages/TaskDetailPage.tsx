import { useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, TriangleAlertIcon, Trash2Icon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { ChangeLogList } from "@/components/ChangeLogList";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RichTextView } from "@/components/RichTextView";
import { StatusSelect } from "@/components/StatusSelect";
import { TaskFormModal } from "@/components/TaskFormModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangeLog } from "@/hooks/useChangeLog";
import { useTask } from "@/hooks/useTask";
import { getApiErrorMessage } from "@/lib/apiError";
import { STATUS_LABELS, type TaskFormValues, type TaskStatus } from "@/types/task";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const navigate = useNavigate();
  const { task, isLoading, error, refetch, updateTask, removeTask } = useTask(taskId);
  const changeLog = useChangeLog(taskId, Boolean(task));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleConflict(err: unknown, action: string) {
    if (isAxiosError(err) && err.response?.status === 409) {
      toast.error(`Couldn't ${action}`, {
        description: "This task was changed by someone else. Showing the latest version.",
      });
      refetch();
      return true;
    }
    return false;
  }

  async function handleUpdate(values: TaskFormValues) {
    try {
      await updateTask(values);
      toast.success("Task updated", { description: values.title });
      changeLog.refetch();
    } catch (err) {
      if (!handleConflict(err, "update task")) {
        toast.error("Couldn't update task", { description: getApiErrorMessage(err) });
      }
      throw err;
    }
  }

  async function handleStatusChange(status: TaskStatus) {
    if (!task) return;
    try {
      await updateTask({
        title: task.title,
        description: task.description ?? "",
        status,
        priority: task.priority,
        assignedToUserId: task.assignedToUserId,
        rowVersion: task.rowVersion,
      });
      toast.success(`Marked as ${STATUS_LABELS[status]}`, { description: task.title });
      changeLog.refetch();
    } catch (err) {
      if (!handleConflict(err, "update status")) {
        toast.error("Couldn't update status", { description: getApiErrorMessage(err) });
      }
    }
  }

  async function handleConfirmDelete() {
    if (!task || isDeleting) return;
    setIsDeleting(true);
    try {
      await removeTask(task.rowVersion);
      toast.success("Task deleted", { description: task.title });
      navigate("/");
    } catch (err) {
      if (!handleConflict(err, "delete task")) {
        toast.error("Couldn't delete task", { description: getApiErrorMessage(err) });
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/80 px-6 py-3 backdrop-blur sm:px-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to tasks
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error || !task ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Couldn&apos;t load this task</AlertTitle>
            <AlertDescription>{error ?? "This task doesn't exist or was deleted."}</AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Task #{task.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2Icon data-icon="inline-start" className="text-destructive" />
                  Delete
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-2">
                  <StatusSelect value={task.status} onChange={handleStatusChange} />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority</p>
                <div className="mt-2">
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned to</p>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar name={task.assignedToName} />
                  <span className="text-sm text-foreground">{task.assignedToName}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last modified</p>
                <p className="mt-2 text-sm text-foreground">{formatDateTime(task.modifiedDate)}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
                <p className="mt-2 text-sm text-foreground">{formatDateTime(task.createdDate)}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
              {task.description ? (
                <RichTextView html={task.description} className="mt-2" />
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No description provided.</p>
              )}
            </div>

            <Separator className="my-6" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Activity</p>
              <div className="mt-3">
                <ChangeLogList
                  entries={changeLog.entries}
                  isLoading={changeLog.isLoading}
                  error={changeLog.error}
                  emptyMessage="No changes recorded for this task yet."
                />
              </div>
              {changeLog.totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Page {changeLog.page} of {changeLog.totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={changeLog.page <= 1}
                      onClick={() => changeLog.goToPage(changeLog.page - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={changeLog.page >= changeLog.totalPages}
                      onClick={() => changeLog.goToPage(changeLog.page + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRightIcon />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {task && (
        <TaskFormModal task={task} open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleUpdate} />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{task?.title}&quot;. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleConfirmDelete}>
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
