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

  it("shows qty-prefixed title, delivery and completion badges when finished", () => {
    const endedAt = "2026-07-17T18:45:00.000Z";
    const endedParts = (() => {
      const date = new Date(endedAt);
      return {
        date: date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })();

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
              endedAt,
              participantCount: 4,
            }}
          />
        </SortableContext>
      </DndContext>,
    );

    expect(
      screen.getByText("3 - Beccaro - Misturadeira 25kg"),
    ).toBeInTheDocument();
    expect(screen.getByText("Previsão")).toBeInTheDocument();
    expect(screen.getByText("06/07/2026")).toBeInTheDocument();
    expect(screen.getByText("Conclusão")).toBeInTheDocument();
    expect(screen.getByText(endedParts.date)).toBeInTheDocument();
    expect(screen.getByText(endedParts.time)).toBeInTheDocument();
    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();
    expect(screen.getByText("Previsão").parentElement?.className).toContain(
      "destructive",
    );
    expect(screen.getByText("Conclusão").parentElement?.className).toContain(
      "secondary",
    );
    expect(screen.getByLabelText(/Tempo estimado/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tempo gasto/)).toBeInTheDocument();
    expect(
      screen.getByLabelText("4 colaborador(es)"),
    ).toBeInTheDocument();
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

  it("shows progress bar footer for waiting tasks", () => {
    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard
            task={{
              ...task,
              status: "waiting",
              totalTimeSpent: 0,
              totalExpectedTime: 3600,
              progressInput: {
                subTasks: [
                  {
                    status: "waiting",
                    expectedTime: 3600,
                    timeSpent: 0,
                  },
                ],
                openActivityStartedAts: [],
              },
              progressNowMs: Date.parse("2026-07-16T12:00:00.000Z"),
            }}
          />
        </SortableContext>
      </DndContext>,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
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
