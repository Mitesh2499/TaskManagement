import { cn } from "@/lib/cn";

const COLORS = [
  "bg-rose-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-sky-400",
  "bg-violet-400",
  "bg-fuchsia-400",
  "bg-teal-400",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function getColorClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

export function Avatar({ name, size = "sm", className }: AvatarProps) {
  const sizeClass = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs";

  return (
    <div
      title={name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white select-none",
        sizeClass,
        getColorClass(name),
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
