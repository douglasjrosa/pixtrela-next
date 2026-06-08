import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskSubtaskPanel } from "./kiosk-subtask-panel";

const subTasks = [
  {
    documentId: "a",
    name: "Tarefa A",
    index: 0,
    status: "queued" as const,
    activationStatus: "unlocked" as const,
    qty: 1,
    completedQty: 0,
    sharingType: "duration" as const,
    timeSpent: 0,
    startedAt: null,
  },
  {
    documentId: "b",
    name: "Tarefa B",
    index: 1,
    status: "queued" as const,
    activationStatus: "locked" as const,
    qty: 5,
    completedQty: 0,
    sharingType: "qty" as const,
    timeSpent: 0,
    startedAt: null,
  },
];

describe("KioskSubtaskPanel", () => {
  it("enables start only for unlocked queued subtasks", () => {
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={subTasks}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const startButtons = screen.getAllByRole("button", { name: "Iniciar" });
    expect(startButtons[0]).not.toBeDisabled();
    expect(startButtons[1]).toBeDisabled();
  });

  it("shows exit form for producing duration subtask", async () => {
    const user = userEvent.setup();
    const onExit = vi.fn();
    const producing = [
      {
        documentId: "a",
        name: "Tarefa A",
        index: 0,
        status: "producing" as const,
        activationStatus: "unlocked" as const,
        qty: 1,
        completedQty: 0,
        sharingType: "duration" as const,
        timeSpent: 0,
        startedAt: "2026-06-05T10:00:00.000Z",
      },
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

  it("shows qty form for producing qty subtask", async () => {
    const user = userEvent.setup();
    const producing = [
      {
        documentId: "a",
        name: "Tarefa A",
        index: 0,
        status: "producing" as const,
        activationStatus: "unlocked" as const,
        qty: 10,
        completedQty: 0,
        sharingType: "qty" as const,
        timeSpent: 0,
        startedAt: "2026-06-05T10:00:00.000Z",
      },
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
      {
        documentId: "a",
        name: "Tarefa A",
        index: 0,
        status: "producing" as const,
        activationStatus: "unlocked" as const,
        qty: 1,
        completedQty: 0,
        sharingType: "duration" as const,
        timeSpent: 30,
        startedAt: "2026-06-05T10:00:00.000Z",
      },
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
      {
        documentId: "a",
        name: "Tarefa A",
        index: 0,
        status: "finished" as const,
        activationStatus: "unlocked" as const,
        qty: 1,
        completedQty: 0,
        sharingType: "duration" as const,
        timeSpent: 125,
        startedAt: null,
      },
      {
        documentId: "b",
        name: "Tarefa B",
        index: 1,
        status: "queued" as const,
        activationStatus: "unlocked" as const,
        qty: 1,
        completedQty: 0,
        sharingType: "duration" as const,
        timeSpent: 0,
        startedAt: null,
      },
    ];
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={finished}
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

  it("shows empty state when no subtasks", () => {
    renderWithIntl(
      <KioskSubtaskPanel
        subTasks={[]}
        onStart={vi.fn()}
        onExit={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Nenhuma subtarefa atribuída."),
    ).toBeInTheDocument();
  });
});
