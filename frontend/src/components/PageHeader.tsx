import { useState } from "react";
import { HistoryIcon, LayoutGridIcon, ListIcon, ListChecksIcon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/useAuth";
import { Avatar } from "@/components/Avatar";
import { ChangeLogDialog } from "@/components/ChangeLogDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TabId = "board" | "list";

interface PageHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function PageHeader({ activeTab, onTabChange }: PageHeaderProps) {
  const { name, email, logout } = useAuth();
  const [isChangeLogOpen, setIsChangeLogOpen] = useState(false);

  function handleLogout() {
    logout();
    toast.info("Logged out");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ListChecksIcon className="size-4" />
          </div>
          <span className="font-semibold text-foreground">Task Management</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 transition hover:bg-muted focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Avatar name={name ?? email ?? "?"} size="default" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="max-w-64 font-normal text-foreground">
              <p className="truncate font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-5 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your team&apos;s work across every stage
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsChangeLogOpen(true)}>
          <HistoryIcon data-icon="inline-start" />
          Change log
        </Button>
      </div>

      <ChangeLogDialog open={isChangeLogOpen} onOpenChange={setIsChangeLogOpen} />

      <div className="px-6 sm:px-8">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabId)}>
          <TabsList variant="line">
            <TabsTrigger value="board">
              <LayoutGridIcon />
              Board
            </TabsTrigger>
            <TabsTrigger value="list">
              <ListIcon />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
