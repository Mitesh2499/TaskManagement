import { cn } from "@/lib/cn";
import type { Assignee } from "@/types/task";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

interface AvatarProps {
  assignee: Assignee;
  size?: "sm" | "md";
  className?: string;
}

export function Avatar({ assignee, size = "sm", className }: AvatarProps) {
  const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs";

  return (
    <div
      title={assignee.name}
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white select-none",
        sizeClass,
        assignee.colorClass,
        className,
      )}
    >
      {getInitials(assignee.name)}
    </div>
  );
}
