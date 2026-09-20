import { ClipboardListIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/Avatar";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RichTextView } from "@/components/RichTextView";
import { SortableTableHead } from "@/components/SortableTableHead";
import { StatusSelect } from "@/components/StatusSelect";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SortDirection, SortKey } from "@/lib/taskSort";
import type { Task, TaskStatus } from "@/types/task";

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onNewTask: () => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortChange: (key: SortKey) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TaskListView({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onNewTask,
  sortKey,
  sortDirection,
  onSortChange,
}: TaskListViewProps) {
  const navigate = useNavigate();

  if (tasks.length === 0) {
    return (
      <Empty className="border border-dashed bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardListIcon />
          </EmptyMedia>
          <EmptyTitle>No tasks found</EmptyTitle>
          <EmptyDescription>Try adjusting your filters, or create a new task.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onNewTask}>New Task</Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="Task" sortKey="title" activeKey={sortKey} direction={sortDirection} onSort={onSortChange} />
            <SortableTableHead label="Status" sortKey="status" activeKey={sortKey} direction={sortDirection} onSort={onSortChange} />
            <SortableTableHead label="Priority" sortKey="priority" activeKey={sortKey} direction={sortDirection} onSort={onSortChange} />
            <SortableTableHead
              label="Assigned To"
              sortKey="assignedToName"
              activeKey={sortKey}
              direction={sortDirection}
              onSort={onSortChange}
            />
            <SortableTableHead
              label="Modified"
              sortKey="modifiedDate"
              activeKey={sortKey}
              direction={sortDirection}
              onSort={onSortChange}
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => navigate(`/tasks/${task.id}`)}
            >
              <TableCell className="max-w-xs whitespace-normal wrap-break-word">
                <p className="font-medium text-foreground">{task.title}</p>
                {task.description && (
                  <RichTextView html={task.description} clamp={1} className="mt-0.5 text-xs text-muted-foreground" />
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <StatusSelect value={task.status} onChange={(status) => onStatusChange(task, status)} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignedToName} />
                  <span className="text-foreground">{task.assignedToName}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(task.modifiedDate)}</TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Task actions">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
