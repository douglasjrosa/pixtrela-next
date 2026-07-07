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
  status: "waiting" as const,
  stepId: 1,
  index: 0,
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

    await user.click(screen.getByText("Tarefa A"));
    expect(onTaskClick).toHaveBeenCalledWith(task);
  });

  it("shows delivery and status badges on opposite sides", () => {
    renderWithIntl(
      <DndContext>
        <SortableContext
          items={[toKanbanTaskId(task.id)]}
          strategy={verticalListSortingStrategy}
        >
          <KanbanCard
            task={{
              ...task,
              status: "finished",
              deliveryDate: "2026-07-06",
            }}
          />
        </SortableContext>
      </DndContext>,
    );

    expect(screen.getByText("06/07/2026")).toBeInTheDocument();
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
    expect(screen.getByText("06/07/2026").className).toContain("destructive");
  });
});
