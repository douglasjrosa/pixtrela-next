import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KanbanTaskSubtasksModal } from "./kanban-task-subtasks-modal";

const subtasks = [
  { documentId: "st-1", name: "Soldar", status: "waiting" as const, assignedTo: [] },
  {
    documentId: "st-2",
    name: "Pintar",
    status: "producing" as const,
    assignedTo: [{ documentId: "u-1", name: "Ana" }],
  },
];

describe("KanbanTaskSubtasksModal", () => {
  it("lists sub-task names as buttons and selects one", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();

    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        loading={false}
        onClose={onClose}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tarefa A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Soldar/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pintar/ })).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Aguardando")).toBeInTheDocument();
    expect(screen.getByText("Produzindo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pintar/ }));
    expect(onSelect).toHaveBeenCalledWith(subtasks[1]);
  });

  it("calls onAddSubtask when add button is clicked", async () => {
    const user = userEvent.setup();
    const onAddSubtask = vi.fn();

    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        loading={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onAddSubtask={onAddSubtask}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Adicionar subtarefa" }));
    expect(onAddSubtask).toHaveBeenCalledOnce();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        loading={false}
        onClose={onClose}
        onSelect={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows empty state when there are no sub-tasks", () => {
    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa B"
        subtasks={[]}
        loading={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Nenhuma subtarefa nesta tarefa.")).toBeInTheDocument();
  });
});
