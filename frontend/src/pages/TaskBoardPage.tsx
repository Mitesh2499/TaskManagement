import { useState } from "react";
import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader, type TabId } from "@/components/PageHeader";
import { TaskBoard } from "@/components/TaskBoard";
import { allAssignees, mockColumns } from "@/data/mockTasks";

export function TaskBoardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("board");

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader members={allAssignees} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="px-6 py-6 sm:px-8">
        {activeTab === "board" ? (
          <TaskBoard columns={mockColumns} />
        ) : (
          <ComingSoon label={activeTab} />
        )}
      </main>
    </div>
  );
}
