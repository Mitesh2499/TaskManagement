import { Avatar as AvatarRoot, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

// Deterministic per-name color so the same person always renders the same
// swatch — distinct from the neutral theme since these represent identity, not state.
const COLOR_VARS = [
  "oklch(0.7 0.16 20)",
  "oklch(0.75 0.15 70)",
  "oklch(0.7 0.15 150)",
  "oklch(0.7 0.13 230)",
  "oklch(0.7 0.15 290)",
  "oklch(0.7 0.18 330)",
  "oklch(0.7 0.13 190)",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return COLOR_VARS[hash % COLOR_VARS.length];
}

interface AvatarProps {
  name: string;
  size?: "sm" | "default";
  className?: string;
}

export function Avatar({ name, size = "sm", className }: AvatarProps) {
  return (
    <AvatarRoot title={name} size={size} className={cn(className)}>
      <AvatarFallback
        style={{ backgroundColor: getColor(name), color: "white" }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </AvatarRoot>
  );
}
