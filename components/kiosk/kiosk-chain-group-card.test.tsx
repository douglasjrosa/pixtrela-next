import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { KioskGroupUnit } from "@/lib/business/kiosk-queue-units";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import { renderWithIntl } from "@/test/test-utils";
import { KioskChainGroupCard } from "./kiosk-chain-group-card";
import { KioskSubtaskPanel } from "./kiosk-subtask-panel";

function kioskSubTask(
  overrides: Partial<KioskSubTask> & Pick<KioskSubTask, "documentId" | "name">,
): KioskSubTask {
  return {
    documentId: overrides.documentId,
    name: overrides.name,
    index: overrides.index ?? 0,
    status: overrides.status ?? "waiting",
    activationStatus: overrides.activationStatus ?? "unlocked",
    qty: overrides.qty ?? 1,
    targetQty: overrides.targetQty ?? overrides.qty ?? 1,
    completedQty: overrides.completedQty ?? 0,
    sharingType: overrides.sharingType ?? "duration",
    timeSpent: overrides.timeSpent ?? 0,
    startedAt: overrides.startedAt ?? null,
    expectedTime: overrides.expectedTime ?? 10,
    taskDocumentId: overrides.taskDocumentId ?? "task-1",
    taskName: overrides.taskName ?? "Tarefa pai",
    taskIndex: overrides.taskIndex ?? 0,
    finishedAt: overrides.finishedAt ?? null,
    activeWorkerCount: overrides.activeWorkerCount ?? 0,
    linkedToPrevious: overrides.linkedToPrevious ?? false,
    maxSameTimeWorkers: overrides.maxSameTimeWorkers ?? 1,
    assignedToIds: overrides.assignedToIds ?? ["u1"],
    dependencyIds: overrides.dependencyIds ?? [],
  };
}

function groupUnit(partial: Partial<KioskGroupUnit> = {}): KioskGroupUnit {
  const members = partial.members ?? [
    kioskSubTask({ documentId: "a", name: "Cortar", index: 0 }),
    kioskSubTask({
      documentId: "b",
      name: "Embalar",
      index: 1,
      linkedToPrevious: true,
    }),
  ];
  return {
    type: "group",
    headId: members[0]!.documentId,
    memberIds: members.map((item) => item.documentId),
    members,
    locked: false,
    principalActive: false,
    chainRunId: null,
    runStartedAt: null,
    showStart: true,
    ...partial,
  };
}

describe("KioskChainGroupCard", () => {
  it("starts the chain with one button at the bottom", async () => {
    const user = userEvent.setup();
    const onStartChain = vi.fn();
    renderWithIntl(
      <KioskChainGroupCard unit={groupUnit()} onStartChain={onStartChain} />,
    );
    expect(screen.getByTestId("kiosk-chain-group")).toBeInTheDocument();
    expect(screen.getByText("Cortar")).toBeInTheDocument();
    expect(screen.getByText("Embalar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(onStartChain).toHaveBeenCalledWith("a");
  });

  it("collects member answers before confirming stop", async () => {
    const user = userEvent.setup();
    const onConfirmChainStop = vi.fn();
    const members = [
      kioskSubTask({
        documentId: "a",
        name: "Cortar",
        status: "producing",
        startedAt: "2026-08-16T12:00:00.000Z",
      }),
      kioskSubTask({
        documentId: "b",
        name: "Embalar",
        index: 1,
        linkedToPrevious: true,
        status: "waiting",
      }),
    ];
    renderWithIntl(
      <KioskChainGroupCard
        unit={groupUnit({
          members,
          principalActive: true,
          chainRunId: "run-1",
          runStartedAt: "2026-08-16T12:00:00.000Z",
        })}
        onConfirmChainStop={onConfirmChainStop}
        onAdvanceChain={vi.fn()}
      />,
    );

    const stop = screen.getByRole("button", { name: "Parar" });
    await user.click(stop);
    expect(stop).toBeDisabled();
    expect(screen.getAllByText("A subtarefa foi concluída?")).toHaveLength(2);

    const yesButtons = screen.getAllByRole("button", { name: "Sim, concluí" });
    await user.click(yesButtons[0]!);
    expect(stop).toBeDisabled();
    await user.click(yesButtons[1]!);
    expect(stop).toBeEnabled();
    await user.click(stop);
    expect(onConfirmChainStop).toHaveBeenCalledWith("run-1", [
      { documentId: "a", completed: true },
      { documentId: "b", completed: true },
    ]);
  });
});

describe("KioskSubtaskPanel helper isolated card", () => {
  it("lets a helper exit duration without finished yes/no", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    renderWithIntl(
      <KioskSubtaskPanel
        units={[
          {
            type: "isolated",
            helperMode: true,
            showStart: false,
            subTask: kioskSubTask({
              documentId: "b",
              name: "Embalar",
              status: "producing",
              startedAt: "2026-08-16T12:00:00.000Z",
              activeWorkerCount: 1,
              maxSameTimeWorkers: 2,
            }),
          },
        ]}
        onStart={vi.fn()}
        onExit={onExit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sair da subtarefa" }));
    expect(
      screen.queryByRole("button", { name: "Sim, concluí" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));
    expect(onExit).toHaveBeenCalledWith("b", {
      sharingType: "duration",
      isCompleted: false,
    });
  });
});
