import { describe, expect, it, vi } from "vitest";
import { screen, within, fireEvent } from "@testing-library/react";
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
    viewerCurrencyAwarded: overrides.viewerCurrencyAwarded,
    activeWorkerCount: overrides.activeWorkerCount ?? 0,
    linkedToPrevious: overrides.linkedToPrevious ?? false,
    maxSameTimeWorkers: overrides.maxSameTimeWorkers ?? 1,
    assignedToIds: overrides.assignedToIds ?? ["u1"],
    dependencyIds: overrides.dependencyIds ?? [],
    recordedQtyThisRun: overrides.recordedQtyThisRun,
    viewerWorkedThisRun: overrides.viewerWorkedThisRun,
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

  it("opens a wizard modal while collecting chain stop answers", async () => {
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
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cortar" })).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Cancelar" }),
    ).toBeEnabled();
    expect(
      within(dialog).getByRole("button", { name: "Continuar" }),
    ).toBeDisabled();
    expect(
      within(dialog).queryByRole("button", { name: "Voltar" }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "2",
    );
    expect(
      within(dialog).getByRole("button", { name: "SIM" }),
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
    expect(screen.getByRole("button", { name: "Parar" })).toBeEnabled();
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

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: "Confirmar saída" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Voltar" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "SIM" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("heading", { name: "Embalar" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Voltar" })).toBeEnabled();
    expect(
      within(dialog).queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Continuar" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "SIM" }),
    );

    const confirm = within(dialog).getByRole("button", {
      name: "Confirmar saída",
    });
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirmChainStop).toHaveBeenCalledWith("run-1", [
      { documentId: "a", completed: true },
      { documentId: "b", completed: true },
    ]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides inferred suppliers and still sends them in the payload", async () => {
    const user = userEvent.setup();
    const onConfirmChainStop = vi.fn();
    const members = [
      kioskSubTask({
        documentId: "a",
        name: "Cortar",
        sharingType: "qty",
        qty: 10,
        targetQty: 10,
        completedQty: 0,
        status: "producing",
        startedAt: "2026-08-16T12:00:00.000Z",
        viewerWorkedThisRun: true,
      }),
      kioskSubTask({
        documentId: "b",
        name: "Montar",
        index: 1,
        linkedToPrevious: true,
        sharingType: "qty",
        qty: 5,
        targetQty: 5,
        completedQty: 0,
        dependencyIds: ["a"],
        status: "waiting",
        viewerWorkedThisRun: true,
      }),
      kioskSubTask({
        documentId: "c",
        name: "Embalar",
        index: 2,
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

    const dialog = screen.getByRole("dialog");
    expect(screen.getByRole("heading", { name: "Montar" })).toBeInTheDocument();
    expect(within(dialog).getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "3",
    );

    fireEvent.change(
      within(dialog).getByLabelText("Quantas peças você concluiu?"),
      { target: { value: "5" } },
    );
    await user.click(within(dialog).getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("heading", { name: "Cortar" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("heading", { name: "Embalar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Cortar" }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "3",
    );

    await user.click(within(dialog).getByRole("button", { name: "SIM" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar saída" }),
    );

    expect(onConfirmChainStop).toHaveBeenCalledWith("run-1", [
      { documentId: "a", qty: 5 },
      { documentId: "b", qty: 5 },
      { documentId: "c", completed: true },
    ]);
  });

  it("lets the second peer stop from the group card", () => {
    const members = [
      kioskSubTask({
        documentId: "a",
        name: "Chapas",
        sharingType: "qty",
        qty: 100,
        targetQty: 100,
        status: "producing",
        startedAt: "2026-08-16T12:00:00.000Z",
        recordedQtyThisRun: 10,
        viewerWorkedThisRun: true,
      }),
      kioskSubTask({
        documentId: "b",
        name: "Adesivos",
        index: 1,
        linkedToPrevious: true,
        sharingType: "qty",
        qty: 100,
        targetQty: 100,
        dependencyIds: ["a"],
        status: "producing",
        startedAt: "2026-08-16T12:01:00.000Z",
        recordedQtyThisRun: 20,
        viewerWorkedThisRun: true,
      }),
    ];
    renderWithIntl(
      <KioskChainGroupCard
        unit={activeGroupProps(members)}
        onConfirmChainStop={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Parar" })).toBeEnabled();
    expect(
      screen.getByText("Já registrado: 10 Chapas, 20 Adesivos"),
    ).toBeInTheDocument();
  });

  it("hides the supplier step when min equals max for the last peer", async () => {
    const user = userEvent.setup();
    const onConfirmChainStop = vi.fn();
    const members = [
      kioskSubTask({
        documentId: "a",
        name: "Chapas",
        sharingType: "qty",
        qty: 50,
        targetQty: 50,
        completedQty: 10,
        recordedQtyThisRun: 10,
        viewerWorkedThisRun: true,
        status: "producing",
        startedAt: "2026-08-16T12:00:00.000Z",
      }),
      kioskSubTask({
        documentId: "b",
        name: "Adesivos",
        index: 1,
        linkedToPrevious: true,
        sharingType: "qty",
        qty: 50,
        targetQty: 50,
        completedQty: 20,
        recordedQtyThisRun: 20,
        dependencyIds: ["a"],
        viewerWorkedThisRun: true,
        status: "producing",
        startedAt: "2026-08-16T12:01:00.000Z",
      }),
    ];
    renderWithIntl(
      <KioskChainGroupCard
        unit={activeGroupProps(members)}
        onConfirmChainStop={onConfirmChainStop}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Parar" }));
    const dialog = screen.getByRole("dialog");
    expect(screen.getByRole("heading", { name: "Adesivos" })).toBeInTheDocument();
    fireEvent.change(
      within(dialog).getByLabelText("Quantas peças você concluiu?"),
      { target: { value: "30" } },
    );
    expect(
      screen.queryByRole("heading", { name: "Chapas" }),
    ).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar saída" }),
    );
    expect(onConfirmChainStop).toHaveBeenCalledWith("run-1", [
      { documentId: "a", qty: 40, inferred: true, semBandeira: true },
      { documentId: "b", qty: 30 },
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
