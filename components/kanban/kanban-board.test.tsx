import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KanbanBoard } from "./kanban-board";
import type { KanbanStep, KanbanTask } from "./types";

const steps: KanbanStep[] = [
  {
    id: 1,
    documentId: "step-1",
    name: "Fila de produção",
    taskOrderBy: "manual",
    tasksPerLoad: 10,
  },
  {
    id: 2,
    documentId: "step-2",
    name: "Produzindo",
    taskOrderBy: "manual",
    tasksPerLoad: 10,
  },
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

const columns = [
  {
    stepDocumentId: "step-1",
    totalCount: 1,
    tasks,
    cursor: {
      id: "task-10",
      index: 0,
      deliveryDate: null,
      createdAt: new Date(0).toISOString(),
    },
  },
  {
    stepDocumentId: "step-2",
    totalCount: 0,
    tasks: [],
    cursor: null,
  },
];

describe("KanbanBoard", () => {
  it("renders a column per step", () => {
    renderWithIntl(<KanbanBoard steps={steps} columns={columns} />);
    expect(
      screen.getByRole("region", { name: "Fila de produção" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Produzindo" })).toBeInTheDocument();
  });

  it("places a task in its step column and shows empty state otherwise", () => {
    renderWithIntl(<KanbanBoard steps={steps} columns={columns} />);
    expect(screen.getByText("1 - Tarefa A")).toBeInTheDocument();
    expect(screen.getByText("Sem tarefas nesta etapa.")).toBeInTheDocument();
  });

  it("keeps horizontal scroll on the board row", () => {
    const { container } = renderWithIntl(
      <KanbanBoard steps={steps} columns={columns} />,
    );
    expect(container.querySelector(".overflow-x-auto")).not.toBeNull();
  });
});
