import { PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/types/task";
import type { User } from "@/types/user";

const ALL_STATUSES = "all";
const ALL_PRIORITIES = "all";
const ALL_ASSIGNEES = "all";

interface TaskToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TaskStatus | "";
  onStatusChange: (value: TaskStatus | "") => void;
  priority: TaskPriority | "";
  onPriorityChange: (value: TaskPriority | "") => void;
  assignee: number | "";
  onAssigneeChange: (value: number | "") => void;
  users: User[];
  onNewTask: () => void;
  isFetching?: boolean;
}

export function TaskToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  users,
  onNewTask,
  isFetching,
}: TaskToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <InputGroup className="w-64">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title or assignee…"
        />
      </InputGroup>

      {isFetching && <Spinner className="text-muted-foreground" aria-label="Refreshing tasks" />}

      <Select
        value={status || ALL_STATUSES}
        onValueChange={(v) => onStatusChange(v === ALL_STATUSES ? "" : (v as TaskStatus))}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={priority || ALL_PRIORITIES}
        onValueChange={(v) => onPriorityChange(v === ALL_PRIORITIES ? "" : (v as TaskPriority))}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL_PRIORITIES}>All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={assignee ? String(assignee) : ALL_ASSIGNEES}
        onValueChange={(v) => onAssigneeChange(v === ALL_ASSIGNEES ? "" : Number(v))}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All assignees" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL_ASSIGNEES}>All assignees</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                {user.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button onClick={onNewTask} className="ml-auto">
        <PlusIcon data-icon="inline-start" />
        New Task
      </Button>
    </div>
  );
}
