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

function activeGroupProps(members = groupUnit().members) {
  return groupUnit({
    members,
    principalActive: true,
    chainRunId: "run-1",
    runStartedAt: "2026-08-16T12:00:00.000Z",
  });
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

  it("keeps stop enabled while the card is active", () => {
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
        unit={activeGroupProps(members)}
        onConfirmChainStop={vi.fn()}
        onAdvanceChain={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Parar" })).toBeEnabled();
  });

  it("hides stop and keeps member forms enabled while collecting", async () => {
    const user = userEvent.setup();
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
        unit={activeGroupProps(members)}
        onConfirmChainStop={vi.fn()}
        onAdvanceChain={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Parar" }));

    expect(
      screen.queryByRole("button", { name: "Parar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: "Sim, concluí" })[0],
    ).toBeEnabled();
  });

  it("hides dependency lock overlay while the chain is active", () => {
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
        unit={{
          ...activeGroupProps(members),
          locked: true,
        }}
        onConfirmChainStop={vi.fn()}
        onAdvanceChain={vi.fn()}
      />,
    );

    const card = screen.getByTestId("kiosk-chain-group");
    expect(card).toHaveClass("bg-success/10");
    expect(screen.queryByTestId("subtask-locked-overlay")).toBeNull();
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
        unit={activeGroupProps(members)}
        onConfirmChainStop={onConfirmChainStop}
        onAdvanceChain={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Parar" }));
    expect(screen.getAllByText("A subtarefa foi concluída?")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Confirmar saída" }),
    ).not.toBeInTheDocument();

    const yesButtons = screen.getAllByRole("button", { name: "Sim, concluí" });
    await user.click(yesButtons[0]!);
    await user.click(yesButtons[1]!);

    const confirm = screen.getByRole("button", { name: "Confirmar saída" });
    expect(confirm).toBeEnabled();
    await user.click(confirm);
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
