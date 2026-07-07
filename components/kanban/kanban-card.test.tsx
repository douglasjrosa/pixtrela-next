import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";

import { renderWithIntl } from "@/test/test-utils";
import { KanbanCard } from "./kanban-card";

const task = {
  id: 10,
  documentId: "task-10",
  name: "Tarefa A",
  status: "waiting" as const,
  stepId: 1,
};

describe("KanbanCard", () => {
  it("calls onTaskClick when the card is clicked", async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();

    renderWithIntl(
      <DndContext>
        <KanbanCard task={task} onTaskClick={onTaskClick} />
      </DndContext>,
    );

    await user.click(screen.getByText("Tarefa A"));
    expect(onTaskClick).toHaveBeenCalledWith(task);
  });
});
