import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { KioskSubTask } from "@/lib/business/subtask-queue";
import { renderWithIntl } from "@/test/test-utils";
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
    completedQty: overrides.completedQty ?? 0,
    sharingType: overrides.sharingType ?? "duration",
    timeSpent: overrides.timeSpent ?? 0,
    startedAt: overrides.startedAt ?? null,
    expectedTime: overrides.expectedTime ?? 0,
    taskDocumentId: overrides.taskDocumentId ?? "task-1",
    taskName: overrides.taskName ?? "Tarefa pai",
    taskIndex: overrides.taskIndex ?? 0,
    finishedAt: overrides.finishedAt ?? null,
  };
}

const subTasks = [
  kioskSubTask({ documentId: "a", name: "Tarefa A", index: 0 }),
  kioskSubTask({
    documentId: "b",
    name: "Tarefa B",
    index: 1,
    activationStatus: "locked",
  }),
];

describe("KioskSubtaskPanel", () => {
  it("shows lock overlay and muted background for locked queued subtasks", () => {
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={subTasks}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const lockedItem = screen.getByText("Tarefa B").closest("li");
    const unlockedItem = screen.getByText("Tarefa A").closest("li");
    expect(lockedItem).not.toBeNull();
    expect(unlockedItem).not.toBeNull();
    expect(within(lockedItem!).getByTestId("subtask-locked-overlay")).toBeInTheDocument();
    expect(
      within(unlockedItem!).queryByTestId("subtask-locked-overlay"),
    ).toBeNull();
    expect(lockedItem).toHaveClass("bg-muted/50");
  });

  it("shows only start on unlocked startable subtasks when idle", () => {
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={subTasks}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Iniciar" })).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Sair da subtarefa" }),
    ).toBeNull();
  });

  it("shows task name before subtask name", () => {
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={subTasks}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Tarefa pai").length).toBeGreaterThan(0);
  });

  it("shows exit form for producing duration subtask", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    const producing = [
      kioskSubTask({
        documentId: "a",
        name: "Tarefa A",
        status: "producing",
        startedAt: "2026-06-05T10:00:00.000Z",
      }),
    ];

    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={producing}
        onStart={vi.fn()}
        onExit={onExit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sair da subtarefa" }));
    expect(screen.getByText("A subtarefa foi concluída?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Não, ainda não" }));
    expect(onExit).toHaveBeenCalledWith("a", {
      sharingType: "duration",
      isCompleted: false,
    });
  });

  it("shows only exit while producing", () => {
    const producing = [
      kioskSubTask({
        documentId: "a",
        name: "Tarefa A",
        status: "producing",
        startedAt: "2026-06-05T10:00:00.000Z",
      }),
      kioskSubTask({
        documentId: "b",
        name: "Tarefa B",
        index: 1,
        activationStatus: "unlocked",
      }),
    ];

    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={producing}
        allSubTasks={producing}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Sair da subtarefa" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Iniciar" })).toBeNull();
  });

  it("shows qty form for producing qty subtask", async () => {
    const user = userEvent.setup();
    const producing = [
      kioskSubTask({
        documentId: "a",
        name: "Tarefa A",
        status: "producing",
        sharingType: "qty",
        qty: 10,
        startedAt: "2026-06-05T10:00:00.000Z",
      }),
    ];

    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={producing}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sair da subtarefa" }));
    expect(
      screen.getByLabelText("Quantas peças você concluiu?"),
    ).toBeInTheDocument();
  });

  it("shows start time and elapsed timer for producing subtask", () => {
    const producing = [
      kioskSubTask({
        documentId: "a",
        name: "Tarefa A",
        status: "producing",
        timeSpent: 30,
        startedAt: "2026-06-05T10:00:00.000Z",
      }),
    ];
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={producing}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Início:/)).toBeInTheDocument();
    expect(screen.getByText(/Tempo decorrido:/)).toBeInTheDocument();
  });

  it("shows finished subtask with time spent and no actions", () => {
    const finished = [
      kioskSubTask({
        documentId: "a",
        name: "Tarefa A",
        status: "finished",
        timeSpent: 125,
      }),
      kioskSubTask({
        documentId: "b",
        name: "Tarefa B",
        index: 1,
      }),
    ];
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={finished}
        allSubTasks={finished}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const finishedItem = screen.getByText("Finalizada").closest("li");
    expect(finishedItem).not.toBeNull();
    expect(within(finishedItem!).queryByRole("button")).toBeNull();
    expect(screen.getByText(/Tempo gasto:/)).toBeInTheDocument();
    expect(screen.getByText("3min")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Iniciar" })).toHaveLength(1);
  });

  it("calls onStart when start is clicked", () => {
    const onStart = vi.fn();
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={subTasks}
        onStart={onStart}
        onExit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Iniciar" })[0]);
    expect(onStart).toHaveBeenCalledWith("a");
  });

  it("hides action buttons in read-only mode", () => {
    renderWithIntl(<KioskSubtaskPanel subTasks={subTasks} readOnly />);

    expect(screen.queryByRole("button", { name: "Iniciar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sair da subtarefa" })).toBeNull();
  });
});
