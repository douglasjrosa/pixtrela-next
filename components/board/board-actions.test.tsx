import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { resolveKanbanMove } from "@/components/kanban/kanban-board";
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
    status: "waiting" as const,
    stepId: 1,
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
        moveTask={vi.fn()}
        loadSubtasks={vi.fn()}
        updateSubtaskAssignees={vi.fn()}
        createSubtask={vi.fn()}
      />,
    );
    expect(screen.getByRole("region", { name: "Fila de produção" })).toBeInTheDocument();
    expect(screen.getByText("Tarefa A")).toBeInTheDocument();
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
        moveTask={vi.fn()}
        loadSubtasks={loadSubtasks}
        updateSubtaskAssignees={vi.fn()}
        createSubtask={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Tarefa A"));

    expect(loadSubtasks).toHaveBeenCalledWith("task-10");
    expect(await screen.findByRole("button", { name: /Soldar/ })).toBeInTheDocument();
  });

  it("calls moveTask when kanban move resolves", () => {
    const moveTask = vi.fn();
    const move = resolveKanbanMove(10, 2);
    expect(move).toEqual({ taskId: 10, stepId: 2 });

    if (move) {
      moveTask(move.taskId, move.stepId);
    }

    expect(moveTask).toHaveBeenCalledWith(10, 2);
  });

  it("closes assign modal after save and does not reopen it", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      { documentId: "st-1", name: "Soldar", status: "waiting" as const, assignedTo: [] },
    ]);
    const updateSubtaskAssignees = vi.fn().mockImplementation(async () => {
      loadSubtasks.mockResolvedValue([
        { documentId: "st-1", name: "Soldar", status: "producing" as const, assignedTo: [{ documentId: "u-1", name: "Ana" }] },
      ]);
    });

    renderWithIntl(
      <BoardActions
        steps={steps}
        tasks={tasks}
        teams={teams}
        moveTask={vi.fn()}
        loadSubtasks={loadSubtasks}
        updateSubtaskAssignees={updateSubtaskAssignees}
        createSubtask={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    expect(screen.getByRole("heading", { name: "Atribuir colaboradores" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(updateSubtaskAssignees).toHaveBeenCalledWith("st-1", "task-10", ["u-1"]);
    });
    expect(
      screen.queryByRole("heading", { name: "Atribuir colaboradores" }),
    ).not.toBeInTheDocument();
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
        moveTask={vi.fn()}
        loadSubtasks={loadSubtasks}
        updateSubtaskAssignees={vi.fn()}
        createSubtask={createSubtask}
      />,
    );

    await user.click(screen.getByText("Tarefa A"));
    await user.click(await screen.findByRole("button", { name: "Adicionar subtarefa" }));
    expect(screen.getByRole("heading", { name: "Nova subtarefa" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nome"), "Cortar");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(createSubtask).toHaveBeenCalledWith(
        "task-10",
        expect.objectContaining({ name: "Cortar" }),
      );
    });
    expect(
      screen.queryByRole("heading", { name: "Nova subtarefa" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tarefa A" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Cortar/ })).toBeInTheDocument();
  });
});
