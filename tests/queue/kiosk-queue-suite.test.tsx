import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { buildKioskQueueUnits } from "@/lib/business/kiosk-queue-units";
import { canConfirmFinishWithFlags } from "@/lib/business/subtask-material-flags";
import { KioskDailyQueue } from "@/components/kiosk/kiosk-daily-queue";
import { KioskExitSubtaskForm } from "@/components/kiosk/kiosk-exit-subtask-form";
import { renderWithIntl } from "@/test/test-utils";
import type { KioskSectionState } from "@/components/kiosk/kiosk-daily-queue";
import type { KioskQueueUnit } from "@/lib/business/kiosk-queue-units";

import {
  idleStartCount,
  queueTask,
  startFlags,
  visibleStartIds,
} from "./queue-task";

const noop = () => undefined;

function emptySection(expanded = false): KioskSectionState {
  return {
    producingUnits: [],
    units: [],
    nextCursor: null,
    hasMore: false,
    expanded,
    loading: false,
    loadedOnce: true,
  };
}

function renderLiberadas(
  producingUnits: KioskQueueUnit[],
  units: KioskQueueUnit[],
): void {
  renderWithIntl(
    <KioskDailyQueue
      colaboratorId="u1"
      allSubTasks={[]}
      liberadas={{ ...emptySection(), producingUnits, units }}
      bloqueadas={emptySection()}
      finalizadas={emptySection()}
      onLoadMoreLiberadas={noop}
      onToggleBloqueadas={noop}
      onLoadMoreBloqueadas={noop}
      onToggleFinalizadas={noop}
      onLoadMoreFinalizadas={noop}
      onStart={noop}
      onStartChain={noop}
    />,
  );
}

describe("kiosk queue suite — start visibility", () => {
  it("grants a single Iniciar across two waiting isolated cards", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({ documentId: "qty", name: "Qty", index: 0 }),
        queueTask({ documentId: "dur", name: "Duration", index: 1 }),
      ],
    });
    expect(idleStartCount(units)).toBe(1);
    expect(visibleStartIds(units)).toEqual(["qty"]);
  });

  it("hides Iniciar on the viewer's own producing isolated card", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "qty",
          name: "Qty",
          index: 0,
          sharingType: "qty",
          qty: 10,
          targetQty: 10,
          status: "producing",
          startedAt: "2026-09-21T12:00:00.000Z",
          activeWorkerCount: 1,
        }),
        queueTask({ documentId: "dur", name: "Duration", index: 1 }),
      ],
    });
    expect(startFlags(units)).toEqual([false, false]);
  });

  it("restores a single Iniciar after an incomplete qty session", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "qty",
          name: "Qty",
          index: 0,
          sharingType: "qty",
          qty: 10,
          targetQty: 10,
          completedQty: 5,
          status: "waiting",
        }),
        queueTask({ documentId: "dur", name: "Duration", index: 1 }),
      ],
    });
    expect(visibleStartIds(units)).toEqual(["qty"]);
  });

  it("moves the single Iniciar to duration after qty is finished", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "qty",
          name: "Qty",
          index: 0,
          sharingType: "qty",
          qty: 10,
          targetQty: 10,
          completedQty: 10,
          status: "finished",
        }),
        queueTask({ documentId: "dur", name: "Duration", index: 1 }),
      ],
    });
    expect(visibleStartIds(units)).toEqual(["dur"]);
  });

  it("hides Iniciar while duration is producing for the viewer", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "dur",
          name: "Duration",
          index: 0,
          status: "producing",
          startedAt: "2026-09-21T12:00:00.000Z",
          activeWorkerCount: 1,
        }),
        queueTask({
          documentId: "chain-a",
          name: "Chain A",
          index: 1,
        }),
      ],
    });
    expect(idleStartCount(units)).toBe(0);
  });

  it("restores Iniciar on duration after an incomplete exit", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "dur",
          name: "Duration",
          index: 0,
          status: "waiting",
        }),
        queueTask({
          documentId: "chain-a",
          name: "Chain A",
          index: 1,
        }),
      ],
    });
    expect(visibleStartIds(units)).toEqual(["dur"]);
  });

  it("renders a multi-member chain as one group with one Iniciar", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({ documentId: "a", name: "Chain A", index: 0 }),
        queueTask({
          documentId: "b",
          name: "Chain B",
          index: 1,
          linkedToPrevious: true,
        }),
      ],
    });
    expect(units).toHaveLength(1);
    expect(units[0]).toMatchObject({ type: "group", showStart: true });
  });

  it("hides chain Iniciar while the viewer is the principal", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "a",
          name: "Chain A",
          index: 0,
          status: "producing",
          startedAt: "2026-09-21T12:00:00.000Z",
          activeWorkerCount: 1,
        }),
        queueTask({
          documentId: "b",
          name: "Chain B",
          index: 1,
          linkedToPrevious: true,
        }),
      ],
      openRuns: [
        {
          chainHeadId: "a",
          chainRunId: "run-1",
          principalId: "u1",
          runStartedAt: "2026-09-21T12:00:00.000Z",
        },
      ],
    });
    expect(units[0]).toMatchObject({ type: "group", showStart: false });
  });

  it("isolates a leftover single remaining chain member with one Iniciar", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "b",
          name: "Chain B",
          index: 1,
          linkedToPrevious: true,
        }),
      ],
      allTaskSubTasks: [
        queueTask({
          documentId: "a",
          name: "Chain A",
          index: 0,
          status: "finished",
        }),
        queueTask({
          documentId: "b",
          name: "Chain B",
          index: 1,
          linkedToPrevious: true,
        }),
      ],
    });
    expect(units).toEqual([
      expect.objectContaining({
        type: "isolated",
        showStart: true,
        subTask: expect.objectContaining({ documentId: "b" }),
      }),
    ]);
  });
});

describe("kiosk queue suite — two workers", () => {
  it("lets a peer join isolated qty when capacity remains", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u2",
      subTasks: [
        queueTask({
          documentId: "qty",
          name: "Qty",
          index: 0,
          sharingType: "qty",
          qty: 10,
          targetQty: 10,
          status: "producing",
          startedAt: null,
          activeWorkerCount: 1,
          maxSameTimeWorkers: 2,
          assignedToIds: ["u1", "u2"],
        }),
        queueTask({
          documentId: "dur",
          name: "Duration",
          index: 1,
          assignedToIds: ["u2"],
        }),
      ],
    });
    expect(visibleStartIds(units)).toEqual(["qty", "dur"]);
  });

  it("hides join when isolated duration is at capacity", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u2",
      subTasks: [
        queueTask({
          documentId: "dur",
          name: "Duration",
          index: 0,
          status: "producing",
          startedAt: null,
          activeWorkerCount: 1,
          maxSameTimeWorkers: 1,
          assignedToIds: ["u1", "u2"],
        }),
        queueTask({
          documentId: "next",
          name: "Next",
          index: 1,
          assignedToIds: ["u2"],
        }),
      ],
    });
    expect(visibleStartIds(units)).toEqual(["next"]);
    expect(
      units.map((unit) =>
        unit.type === "isolated" ? unit.subTask.documentId : unit.headId,
      ),
    ).toEqual(["next"]);
  });

  it("shows chain join to the idle peer and start on the next empty card", () => {
    const members = [
      queueTask({
        documentId: "a",
        name: "Chain A",
        index: 0,
        status: "producing",
        activeWorkerCount: 1,
        maxSameTimeWorkers: 2,
        assignedToIds: ["u1", "u2"],
      }),
      queueTask({
        documentId: "b",
        name: "Chain B",
        index: 1,
        linkedToPrevious: true,
        maxSameTimeWorkers: 2,
        assignedToIds: ["u1", "u2"],
      }),
    ];
    const units = buildKioskQueueUnits({
      viewerId: "u2",
      subTasks: [
        ...members,
        queueTask({
          documentId: "solo",
          name: "Solo",
          index: 2,
          assignedToIds: ["u2"],
        }),
      ],
      openRuns: [
        {
          chainHeadId: "a",
          chainRunId: "run-1",
          principalId: "u1",
          runStartedAt: "2026-09-21T12:00:00.000Z",
        },
      ],
    });
    expect(units[0]).toMatchObject({ type: "group", showStart: true });
    expect(visibleStartIds(units)).toEqual(["a", "solo"]);
    expect(idleStartCount(units)).toBe(2);
  });
});

describe("kiosk queue suite — flags", () => {
  it("blocks finishing a producer when flags are required and none selected", () => {
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: true,
        categoryId: "11111111-1111-4111-8111-111111111111",
        selectedFlagCount: 0,
        availableFlagCount: 2,
        semBandeiraSelected: false,
      }),
    ).toBe(false);
  });

  it("allows an incomplete exit without selecting flags", () => {
    expect(
      canConfirmFinishWithFlags({
        willFinish: false,
        hasDependents: true,
        categoryId: "11111111-1111-4111-8111-111111111111",
        selectedFlagCount: 0,
        availableFlagCount: 2,
        semBandeiraSelected: false,
      }),
    ).toBe(true);
  });

  it("allows finish after one flag is selected", () => {
    expect(
      canConfirmFinishWithFlags({
        willFinish: true,
        hasDependents: true,
        categoryId: "11111111-1111-4111-8111-111111111111",
        selectedFlagCount: 1,
        availableFlagCount: 2,
        semBandeiraSelected: false,
      }),
    ).toBe(true);
  });

  it("disables duration finish until a required flag is chosen", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithIntl(
      <KioskExitSubtaskForm
        sharingType="duration"
        requiresMaterialFlagsOnFinish
        subTaskCategoryId="11111111-1111-4111-8111-111111111111"
        availableFlags={[
          { id: "flag-1", code: "Q-1" },
          { id: "flag-2", code: "Q-2" },
        ]}
        onCancel={noop}
        onConfirm={onConfirm}
      />,
    );
    const finish = screen.getByRole("button", { name: "Sim, concluí" });
    const pause = screen.getByRole("button", { name: "Não, ainda não" });
    expect(finish).toBeDisabled();
    expect(pause).toBeEnabled();
    await user.click(pause);
    expect(onConfirm).toHaveBeenCalledWith({
      sharingType: "duration",
      isCompleted: false,
    });
    await user.click(screen.getByRole("button", { name: "Q-1" }));
    expect(finish).toBeEnabled();
    await user.click(finish);
    expect(onConfirm).toHaveBeenLastCalledWith({
      sharingType: "duration",
      isCompleted: true,
      flagIds: ["flag-1"],
    });
  });
});

describe("kiosk queue suite — Liberadas DOM", () => {
  it("renders a single Iniciar for two waiting isolated cards", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({ documentId: "qty", name: "Qty", index: 0 }),
        queueTask({ documentId: "dur", name: "Duration", index: 1 }),
      ],
    });
    renderLiberadas([], units);
    expect(screen.getAllByRole("button", { name: "Iniciar" })).toHaveLength(1);
  });

  it("renders no Iniciar while the viewer is producing", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({
          documentId: "qty",
          name: "Qty",
          index: 0,
          sharingType: "qty",
          status: "producing",
          startedAt: "2026-09-21T12:00:00.000Z",
          activeWorkerCount: 1,
        }),
        queueTask({ documentId: "dur", name: "Duration", index: 1 }),
      ],
    });
    const producing = units.filter((unit) => unit.showStart === false);
    renderLiberadas(producing, []);
    expect(screen.queryByRole("button", { name: "Iniciar" })).toBeNull();
  });

  it("renders one Iniciar on a chain group card", () => {
    const units = buildKioskQueueUnits({
      viewerId: "u1",
      subTasks: [
        queueTask({ documentId: "a", name: "Chain A", index: 0 }),
        queueTask({
          documentId: "b",
          name: "Chain B",
          index: 1,
          linkedToPrevious: true,
        }),
      ],
    });
    renderLiberadas([], units);
    expect(screen.getByTestId("kiosk-chain-group")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Iniciar" })).toHaveLength(1);
  });
});
