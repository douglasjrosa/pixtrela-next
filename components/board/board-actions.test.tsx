import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { renderWithIntl } from "@/test/test-utils";
import { resolveKanbanDragEnd, toKanbanTaskId } from "@/lib/business/kanban-task-order";
import { BoardActions } from "./board-actions";

const steps = [
  { id: 1, name: "Fila de produção" },
  { id: 2, name: "Produzindo" },
];

const tasks = [
  {
    id: 10,
    documentId: "task-10",
    name: "Tarefa A",
    qty: 1,
    status: "waiting" as const,
    stepId: 1,
    index: 0,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  },
  {
    id: 11,
    documentId: "task-11",
    name: "Tarefa B",
    qty: 2,
    status: "waiting" as const,
    stepId: 1,
    index: 1,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  },
];

const teams = [
  {
    documentId: "team-1",
    name: "Equipe A",
    members: [{ documentId: "u-1", name: "Ana" }],
  },
];

describe("BoardActions", () => {
  it("renders kanban board with steps", () => {
    renderWithIntl(
      <BoardActions
        steps={steps}
        tasks={tasks}
        teams={teams}
        applyBoardTaskOrder={vi.fn()}
        loadSubtasks={vi.fn()}
        updateSubtaskAssignees={vi.fn()}
        createSubtask={vi.fn()}
      />,
    );
    expect(screen.getByRole("region", { name: "Fila de produção" })).toBeInTheDocument();
    expect(screen.getByText("1 - Tarefa A")).toBeInTheDocument();
  });

  it("opens subtasks modal when a task card is clicked", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      { documentId: "st-1", name: "Soldar", status: "waiting" as const, assignedTo: [] },
    ]);

    renderWithIntl(
      <BoardActions
        steps={steps}
        tasks={tasks}
        teams={teams}
        applyBoardTaskOrder={vi.fn()}
        loadSubtasks={loadSubtasks}
        updateSubtaskAssignees={vi.fn()}
        createSubtask={vi.fn()}
      />,
    );

    await user.click(screen.getByText("1 - Tarefa A"));

    expect(loadSubtasks).toHaveBeenCalledWith("task-10");
    expect(await screen.findByText("Soldar")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Atribuir Ana" })).toBeInTheDocument();
  });

  it("resolves same-column reorder updates", () => {
    const orderItems = tasks.map((task) => ({
      id: task.id,
      documentId: task.documentId,
      stepId: task.stepId,
      index: task.index,
    }));
    const result = resolveKanbanDragEnd(
      orderItems,
      steps,
      toKanbanTaskId(11),
      toKanbanTaskId(10),
    );
    expect(result.type).toBe("updates");
  });

  it("keeps assignee toggles local until save is clicked", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      { documentId: "st-1", name: "Soldar", status: "waiting" as const, assignedTo: [] },
    ]);
    const updateSubtaskAssignees = vi.fn().mockImplementation(async () => {
      loadSubtasks.mockResolvedValue([
        {
          documentId: "st-1",
          name: "Soldar",
          status: "waiting" as const,
          assignedTo: [{ documentId: "u-1", name: "Ana" }],
        },
      ]);
    });

    renderWithIntl(
      <BoardActions
        steps={steps}
        tasks={tasks}
        teams={teams}
        applyBoardTaskOrder={vi.fn()}
        loadSubtasks={loadSubtasks}
        updateSubtaskAssignees={updateSubtaskAssignees}
        createSubtask={vi.fn()}
      />,
    );

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: "Atribuir Ana" }));

    expect(updateSubtaskAssignees).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Remover Ana" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(updateSubtaskAssignees).toHaveBeenCalledWith("st-1", "task-10", ["u-1"]);
    });
    expect(
      screen.getByRole("heading", { name: "Atribuir subtarefa" }),
    ).toBeInTheDocument();
  });

  it("opens create modal, saves subtask, and keeps subtasks modal open", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi
      .fn()
      .mockResolvedValueOnce([
        { documentId: "st-1", name: "Soldar", status: "waiting" as const, assignedTo: [] },
      ])
      .mockResolvedValueOnce([
        { documentId: "st-1", name: "Soldar", status: "waiting" as const, assignedTo: [] },
        { documentId: "st-2", name: "Cortar", status: "waiting" as const, assignedTo: [] },
      ]);
    const createSubtask = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <BoardActions
        steps={steps}
        tasks={tasks}
        teams={teams}
        applyBoardTaskOrder={vi.fn()}
        loadSubtasks={loadSubtasks}
        updateSubtaskAssignees={vi.fn()}
        createSubtask={createSubtask}
      />,
    );

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: "Adicionar subtarefa" }));
    expect(screen.getByRole("heading", { name: "Nova subtarefa" })).toBeInTheDocument();

    const createDialog = screen.getByRole("heading", { name: "Nova subtarefa" })
      .closest('[role="dialog"]');
    expect(createDialog).toBeTruthy();

    await user.type(within(createDialog as HTMLElement).getByLabelText("Nome"), "Cortar");
    await user.click(within(createDialog as HTMLElement).getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(createSubtask).toHaveBeenCalledWith(
        "task-10",
        expect.objectContaining({ name: "Cortar" }),
        { addToTemplate: false },
      );
    });
    expect(
      screen.queryByRole("heading", { name: "Nova subtarefa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Atribuir subtarefa" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Cortar")).toBeInTheDocument();
  });
});
