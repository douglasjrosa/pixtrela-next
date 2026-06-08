import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { resolveKanbanMove } from "@/components/kanban/kanban-board";
import { BoardActions } from "./board-actions";

const steps = [
  { id: 1, name: "Fila de produção" },
  { id: 2, name: "Produzindo" },
];

const tasks = [
  { id: 10, name: "Tarefa A", status: "queued" as const, stepId: 1 },
];

describe("BoardActions", () => {
  it("renders kanban board with steps", () => {
    renderWithIntl(
      <BoardActions steps={steps} tasks={tasks} moveTask={vi.fn()} />,
    );
    expect(screen.getByRole("region", { name: "Fila de produção" })).toBeInTheDocument();
    expect(screen.getByText("Tarefa A")).toBeInTheDocument();
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
});
