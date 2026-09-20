import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TaskPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const ELLIPSIS = "ellipsis" as const;

function getPageNumbers(current: number, total: number): (number | typeof ELLIPSIS)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | typeof ELLIPSIS)[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) {
      result.push(ELLIPSIS);
    }
    result.push(p);
    previous = p;
  }
  return result;
}

export function TaskPagination({ page, totalPages, totalCount, pageSize, onPageChange }: TaskPaginationProps) {
  if (totalCount === 0) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  function goTo(target: number) {
    if (target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target);
    }
  }

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{rangeStart}</span>–
        <span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span> tasks
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(page - 1);
                }}
              />
            </PaginationItem>

            {getPageNumbers(page, totalPages).map((p, index) =>
              p === ELLIPSIS ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  goTo(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
