import { Avatar } from "@/components/Avatar";
import type { Assignee } from "@/types/task";

interface AvatarGroupProps {
  assignees: Assignee[];
  size?: "sm" | "md";
  max?: number;
}

export function AvatarGroup({ assignees, size = "sm", max = 4 }: AvatarGroupProps) {
  const visible = assignees.slice(0, max);
  const overflow = assignees.length - visible.length;
  const overflowSizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs";

  return (
    <div className="flex -space-x-2">
      {visible.map((assignee) => (
        <Avatar key={assignee.id} assignee={assignee} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={`flex items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-600 ring-2 ring-white ${overflowSizeClass}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
