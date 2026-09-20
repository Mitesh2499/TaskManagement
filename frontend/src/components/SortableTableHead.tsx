import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDirection, SortKey } from "@/lib/taskSort";

interface SortableTableHeadProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}

export function SortableTableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = sortKey === activeKey;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {isActive ? (
          direction === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : (
          <ArrowUpDownIcon className="size-3.5 text-muted-foreground/40" />
        )}
      </button>
    </TableHead>
  );
}
