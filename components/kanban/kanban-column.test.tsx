import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KANBAN_COLUMN_INITIAL_VISIBLE_COUNT } from "@/lib/kanban/column-visibility";
import { renderWithIntl } from "@/test/test-utils";
import { KanbanColumn } from "./kanban-column";
import type { KanbanStep, KanbanTask } from "./types";

const step: KanbanStep = {
  id: 1,
  documentId: "step-1",
  name: "Fila de produção",
  taskOrderBy: "manual",
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
  it("renders only the initial page of cards", () => {
    renderWithIntl(
      <KanbanColumn step={step} tasks={buildTasks(15)} />,
    );

    expect(screen.getByText("1 - Tarefa 1")).toBeInTheDocument();
    expect(screen.getByText("1 - Tarefa 10")).toBeInTheDocument();
    expect(screen.queryByText("1 - Tarefa 11")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/^1 - Tarefa \d+$/),
    ).toHaveLength(KANBAN_COLUMN_INITIAL_VISIBLE_COUNT);
    expect(screen.getByRole("button", { name: "Carregar mais..." })).toBeInTheDocument();
  });

  it("loads more cards when the button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <KanbanColumn step={step} tasks={buildTasks(15)} />,
    );

    await user.click(screen.getByRole("button", { name: "Carregar mais..." }));

    expect(screen.getByText("1 - Tarefa 11")).toBeInTheDocument();
    expect(screen.getByText("1 - Tarefa 15")).toBeInTheDocument();
    expect(screen.getAllByText(/^1 - Tarefa \d+$/)).toHaveLength(15);
    expect(
      screen.queryByRole("button", { name: "Carregar mais..." }),
    ).not.toBeInTheDocument();
  });

  it("does not stretch to full height when the column has few cards", () => {
    renderWithIntl(
      <KanbanColumn step={step} tasks={buildTasks(2)} />,
    );

    const column = screen.getByRole("region", { name: "Fila de produção" });
    expect(column).toHaveClass("self-start");
    expect(column).not.toHaveClass("h-full");
    expect(
      screen.queryByRole("button", { name: "Carregar mais..." }),
    ).not.toBeInTheDocument();
  });
});
