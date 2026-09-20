import { ArrowLeft, ChevronRight, LayoutGrid, List, Search, Table2, Telescope, Clock } from "lucide-react";
import { AvatarGroup } from "@/components/AvatarGroup";
import { cn } from "@/lib/cn";
import type { Assignee } from "@/types/task";

export type TabId = "overview" | "board" | "list" | "table" | "timeline";

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: Telescope },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "table", label: "Table", icon: Table2 },
  { id: "timeline", label: "Timeline", icon: Clock },
];

interface PageHeaderProps {
  members: Assignee[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function PageHeader({ members, activeTab, onTabChange }: PageHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-6 py-3 sm:px-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button
            type="button"
            aria-label="Back"
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span>Team spaces</span>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <span className="font-medium text-gray-700">Tasks</span>
        </div>

        <div className="relative hidden w-64 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-5 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">Track your team&apos;s work across every stage</p>
        </div>
        <AvatarGroup assignees={members} size="md" max={4} />
      </div>

      <nav className="flex gap-1 overflow-x-auto px-6 sm:px-8">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
