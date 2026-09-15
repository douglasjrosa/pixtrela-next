import { Suspense } from "react";

import { auth } from "@/auth";
import { BoardPageCanvas } from "@/components/board/board-page-canvas";
import type { KanbanStep } from "@/components/kanban/types";
import { APP_BOARD_SHELL_CLASS } from "@/components/layout/app-page-layout";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import type { Role } from "@/lib/auth/nav";
import { canMoveBoardTasks } from "@/lib/auth/permissions";
import type { BoardColumnPage } from "@/lib/board/load-board-data";
import {
  loadBoardPageData,
  withBoardProgressLoaded,
  withBoardProgressPending,
} from "@/lib/board/load-board-page-props";
import type { SubtaskPaymentCurrency } from "@/lib/settings/load-currency-for-subtasks";

async function BoardWithProgress({
  steps,
  columns,
  teams,
  interactive,
  assignWarnMax,
  paymentCurrency,
  assigneePeople,
}: {
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
}) {
  const loaded = await withBoardProgressLoaded(columns);
  return (
    <BoardPageCanvas
      steps={steps}
      columns={loaded.columns}
      teams={teams}
      interactive={interactive}
      assignWarnMax={assignWarnMax}
      assignedCountByColaboratorId={loaded.assignedCountByColaboratorId}
      paymentCurrency={paymentCurrency}
      assigneePeople={assigneePeople}
    />
  );
}

export default async function BoardPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const interactive = canMoveBoardTasks(role);
  const teamsLeaderId = role === "leader" ? session?.user?.id : undefined;
  const { steps, columns, teams, assignWarnMax, paymentCurrency, assigneePeople } =
    await loadBoardPageData({ interactive, teamsLeaderId });

  return (
    <div className={APP_BOARD_SHELL_CLASS}>
      <Suspense
        fallback={
          <BoardPageCanvas
            steps={steps}
            columns={withBoardProgressPending(columns)}
            teams={teams}
            interactive={interactive}
            assignWarnMax={assignWarnMax}
            assignedCountByColaboratorId={{}}
            paymentCurrency={paymentCurrency}
            assigneePeople={assigneePeople}
          />
        }
      >
        <BoardWithProgress
          steps={steps}
          columns={columns}
          teams={teams}
          interactive={interactive}
          assignWarnMax={assignWarnMax}
          paymentCurrency={paymentCurrency}
          assigneePeople={assigneePeople}
        />
      </Suspense>
    </div>
  );
}
