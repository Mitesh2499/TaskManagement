import { LayoutGrid, List, ListChecks, LogOut } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { cn } from "@/lib/cn";

export type TabId = "board" | "list";

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
];

interface PageHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function PageHeader({ activeTab, onTabChange }: PageHeaderProps) {
  const { email, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-6 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
            <ListChecks className="h-4 w-4" />
          </div>
          <span className="font-semibold text-gray-900">Task Management</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">{email}</span>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-5 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">Track your team&apos;s work across every stage</p>
        </div>
      </div>

      <nav className="flex gap-1 px-6 sm:px-8">
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
