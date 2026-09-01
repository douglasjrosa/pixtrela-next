import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KanbanColumn } from "./kanban-column";
import type { KanbanStep, KanbanTask } from "./types";

const step: KanbanStep = {
  id: 1,
  documentId: "step-1",
  name: "Fila de produção",
  taskOrderBy: "manual",
  tasksPerLoad: 10,
};

function buildTasks(count: number): KanbanTask[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    documentId: `task-${index + 1}`,
    name: `Tarefa ${index + 1}`,
    qty: 1,
    status: "waiting" as const,
    stepId: 1,
    index,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  }));
}

describe("KanbanColumn", () => {
  beforeEach(() => {
    class IntersectionObserverStub {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("shows server total and skeleton when hasMore without load-more button", () => {
    renderWithIntl(
      <KanbanColumn
        step={step}
        tasks={buildTasks(10)}
        totalCount={25}
        hasMore
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("1 - Tarefa 1")).toBeInTheDocument();
    expect(screen.getByText("1 - Tarefa 10")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Carregar mais..." }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Carregando mais tarefas" }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("kanban-card-skeleton")).toHaveLength(5);
  });

  it("keeps overflow-x hidden on the column scroll area", () => {
    const { container } = renderWithIntl(
      <KanbanColumn
        step={step}
        tasks={buildTasks(2)}
        totalCount={2}
        hasMore={false}
      />,
    );

    const scrollArea = container.querySelector(".overflow-x-hidden");
    expect(scrollArea).not.toBeNull();
    expect(scrollArea).toHaveClass("overflow-y-auto");
  });

  it("does not stretch to full height when the column has few cards", () => {
    renderWithIntl(
      <KanbanColumn
        step={step}
        tasks={buildTasks(2)}
        totalCount={2}
        hasMore={false}
      />,
    );

    const column = screen.getByRole("region", { name: "Fila de produção" });
    expect(column).toHaveClass("self-start");
    expect(column).toHaveClass("min-w-80");
    expect(column).not.toHaveClass("h-full");
  });
});
