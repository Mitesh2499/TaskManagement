import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ChangeLogList } from "@/components/ChangeLogList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useChangeLog } from "@/hooks/useChangeLog";

interface ChangeLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeLogDialog({ open, onOpenChange }: ChangeLogDialogProps) {
  const { entries, page, totalPages, totalCount, isLoading, error, goToPage } = useChangeLog(undefined, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change log</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <ChangeLogList entries={entries} isLoading={isLoading} error={error} showTaskTitle emptyMessage="No changes recorded yet." />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {totalCount} changes
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => goToPage(page - 1)} aria-label="Previous page">
                <ChevronLeftIcon />
              </Button>
              <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} aria-label="Next page">
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
