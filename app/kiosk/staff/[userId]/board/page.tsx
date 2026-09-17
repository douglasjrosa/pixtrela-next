import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  BoardPageCanvas,
  type BoardCanvasActions,
} from "@/components/board/board-page-canvas";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import type { KanbanStep } from "@/components/kanban/types";
import { APP_BOARD_SHELL_CLASS } from "@/components/layout/app-page-layout";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import {
  assertKioskStaffActor,
  canKioskStaffAccessBoard,
} from "@/lib/business/kiosk-staff-access";
import type { BoardColumnPage } from "@/lib/board/load-board-data";
import {
  loadBoardPageData,
  withBoardProgressLoaded,
  withBoardProgressPending,
} from "@/lib/board/load-board-page-props";
import type { SubtaskPaymentCurrency } from "@/lib/settings/load-currency-for-subtasks";
import { loadSubTaskCategoryOptions } from "@/lib/subtasks/category-options";

import * as kioskBoard from "./actions";

interface PageProps {
  params: Promise<{ userId: string }>;
}

function bindKioskBoardActions(staffUserId: string): BoardCanvasActions {
  return {
    pollBoardProgress: kioskBoard.pollBoardProgress.bind(null, staffUserId),
    applyBoardTaskRelativeMove: kioskBoard.applyBoardTaskRelativeMove.bind(
      null,
      staffUserId,
    ),
    loadMoreBoardColumnTasks: kioskBoard.loadMoreBoardColumnTasks.bind(
      null,
      staffUserId,
    ),
    syncBoardSteps: kioskBoard.syncBoardSteps.bind(null, staffUserId),
    loadFirstBoardColumnPage: kioskBoard.loadFirstBoardColumnPage.bind(
      null,
      staffUserId,
    ),
    loadBoardSubtasks: kioskBoard.loadBoardSubtasks.bind(null, staffUserId),
    loadBoardSubtaskLive: kioskBoard.loadBoardSubtaskLive.bind(
      null,
      staffUserId,
    ),
    loadBoardSubtaskSessions: kioskBoard.loadBoardSubtaskSessions.bind(
      null,
      staffUserId,
    ),
    loadBoardSubtaskSession: kioskBoard.loadBoardSubtaskSession.bind(
      null,
      staffUserId,
    ),
    reorderBoardSubtasks: kioskBoard.reorderBoardSubtasks.bind(
      null,
      staffUserId,
    ),
    updateBoardSubtaskAssignees: kioskBoard.updateBoardSubtaskAssignees.bind(
      null,
      staffUserId,
    ),
    updateBoardSubtaskLink: kioskBoard.updateBoardSubtaskLink.bind(
      null,
      staffUserId,
    ),
    createBoardSubtask: kioskBoard.createBoardSubtask.bind(null, staffUserId),
    releaseBoardSubTaskFlags: kioskBoard.releaseBoardSubTaskFlags.bind(
      null,
      staffUserId,
    ),
  };
}

async function KioskBoardWithProgress({
  steps,
  columns,
  teams,
  interactive,
  assignWarnMax,
  paymentCurrency,
  assigneePeople,
  categoryOptions,
  actions,
}: {
  steps: KanbanStep[];
  columns: BoardColumnPage[];
  teams: TeamAssignmentOption[];
  interactive: boolean;
  assignWarnMax: number;
  paymentCurrency: SubtaskPaymentCurrency;
  assigneePeople: { documentId: string; name: string }[];
  categoryOptions: Awaited<ReturnType<typeof loadSubTaskCategoryOptions>>;
  actions: BoardCanvasActions;
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
      categoryOptions={categoryOptions}
      actions={actions}
    />
  );
}

export default async function KioskStaffBoardPage({ params }: PageProps) {
  const { userId } = await params;
  const actor = await assertKioskStaffActor(userId);
  if (!canKioskStaffAccessBoard(actor.staffRole)) {
    notFound();
  }

  const interactive = canKioskStaffAccessBoard(actor.staffRole);
  const teamsLeaderId = actor.staffRole === "leader" ? actor.staffUserId : undefined;
  const [
    { steps, columns, teams, assignWarnMax, paymentCurrency, assigneePeople },
    categoryOptions,
  ] = await Promise.all([
    loadBoardPageData({ interactive, teamsLeaderId }),
    loadSubTaskCategoryOptions(),
  ]);
  const actions = bindKioskBoardActions(userId);

  return (
    <KioskContentSurface className="max-w-none border-0 p-0 shadow-none">
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
              categoryOptions={categoryOptions}
              actions={actions}
            />
          }
        >
          <KioskBoardWithProgress
            steps={steps}
            columns={columns}
            teams={teams}
            interactive={interactive}
            assignWarnMax={assignWarnMax}
            paymentCurrency={paymentCurrency}
            assigneePeople={assigneePeople}
            categoryOptions={categoryOptions}
            actions={actions}
          />
        </Suspense>
      </div>
    </KioskContentSurface>
  );
}
