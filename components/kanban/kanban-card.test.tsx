import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { toKanbanTaskId } from "@/lib/business/kanban-task-order";
import { renderWithIntl } from "@/test/test-utils";
import { KanbanCard } from "./kanban-card";

const task = {
  id: 10,
  documentId: "task-10",
  name: "Tarefa A",
  qty: 1,
  status: "waiting" as const,
  stepId: 1,
  index: 0,
  totalExpectedTime: 3600,
  totalTimeSpent: 0,
};

const progressInput = {
  subTasks: [
    { status: "producing" as const, expectedTime: 3600, timeSpent: 1800 },
  ],
  openActivityStartedAts: [] as string[],
};

describe("KanbanCard", () => {
  it("calls onTaskClick when the card is clicked", async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();

    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard task={task} onTaskClick={onTaskClick} />
        </SortableContext>
      </DndContext>,
    );

    await user.click(screen.getByText("1 - Tarefa A"));
    expect(onTaskClick).toHaveBeenCalledWith(task);
  });

  it("shows qty-prefixed title with delivery and status badges", () => {
    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard
            task={{
              ...task,
              qty: 3,
              name: "Beccaro - Misturadeira 25kg",
              status: "finished",
              deliveryDate: "2026-07-06",
            }}
          />
        </SortableContext>
      </DndContext>,
    );

    expect(
      screen.getByText("3 - Beccaro - Misturadeira 25kg"),
    ).toBeInTheDocument();
    expect(screen.getByText("06/07/2026")).toBeInTheDocument();
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
    expect(screen.getByText("06/07/2026").className).toContain("destructive");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("styles paused status badge with warning amber", () => {
    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard task={{ ...task, status: "paused" }} />
        </SortableContext>
      </DndContext>,
    );

    expect(screen.getByText("Pausada").className).toContain("bg-yellow-200");
    expect(screen.getByText("Pausada").className).toContain("text-yellow-900");
  });

  it("shows progress bar footer for producing tasks", () => {
    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard
            task={{
              ...task,
              status: "producing",
              totalTimeSpent: 1800,
              totalExpectedTime: 3600,
              progressInput,
              progressNowMs: Date.parse("2026-07-16T12:00:00.000Z"),
            }}
          />
        </SortableContext>
      </DndContext>,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getAllByText("30min")).toHaveLength(2);
  });

  it("shows floating unassigned badge and producing status with active count", () => {
    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard
            task={{
              ...task,
              status: "producing",
              activeColaboratorCount: 3,
              unassignedSubTaskCount: 2,
            }}
          />
        </SortableContext>
      </DndContext>,
    );

    expect(
      screen.getByLabelText("Produzindo · 3 em atividade"),
    ).toHaveTextContent("3");
    expect(
      screen.getByLabelText("2 subtarefa(s) sem colaborador"),
    ).toHaveTextContent("2");
  });

  it("hides floating unassigned badge when count is zero", () => {
    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard
            task={{
              ...task,
              activeColaboratorCount: 0,
              unassignedSubTaskCount: 0,
            }}
          />
        </SortableContext>
      </DndContext>,
    );

    expect(
      screen.queryByLabelText(/subtarefa\(s\) sem colaborador/),
    ).not.toBeInTheDocument();
  });
});
