import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KanbanBoard } from "./kanban-board";
import type { KanbanStep, KanbanTask } from "./types";

const steps: KanbanStep[] = [
  { id: 1, name: "Fila de produção" },
  { id: 2, name: "Produzindo" },
];

const tasks: KanbanTask[] = [
  {
    id: 10,
    documentId: "task-10",
    name: "Tarefa A",
    qty: 1,
    status: "waiting",
    stepId: 1,
    index: 0,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  },
];

describe("KanbanBoard", () => {
  it("renders a column per step", () => {
    renderWithIntl(<KanbanBoard steps={steps} tasks={tasks} />);
    expect(screen.getByRole("region", { name: "Fila de produção" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Produzindo" })).toBeInTheDocument();
  });

  it("places a task in its step column and shows empty state otherwise", () => {
    renderWithIntl(<KanbanBoard steps={steps} tasks={tasks} />);
    expect(screen.getByText("1 - Tarefa A")).toBeInTheDocument();
    expect(screen.getByText("Sem tarefas nesta etapa.")).toBeInTheDocument();
  });
});
