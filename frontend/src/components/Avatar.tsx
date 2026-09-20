import { Avatar as AvatarRoot, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

// FNV-1a: a fast, well-distributed string hash — small changes in the input (or two names
// sharing a prefix) still land on very different hash values, so nearby names don't
// clump onto the same few hues the way a weaker hash or a small fixed palette would.
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// Deterministic per-name color so the same person always renders the same swatch — the
// hash picks a hue around the full color wheel (0-360°) at fixed saturation/lightness,
// distinct from the neutral theme since these represent identity, not state.
function getColor(name: string) {
  const hue = hashString(name.trim().toLowerCase()) % 360;
  return `oklch(0.7 0.15 ${hue})`;
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
