import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { renderWithIntl } from "@/test/test-utils";
import { KanbanTaskSubtasksModal } from "./kanban-task-subtasks-modal";

const teams: TeamAssignmentOption[] = [
  {
    documentId: "team-1",
    name: "Equipe A",
    members: [{ documentId: "u-1", name: "Ana" }],
  },
];

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
  it("lists sub-tasks with inline assignee pickers and a save button", () => {
    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        teams={teams}
        loading={false}
        dirty={false}
        saving={false}
        onClose={vi.fn()}
        onAssigneesChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Atribuir subtarefa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tarefa A")).toBeInTheDocument();
    expect(screen.getByText("Soldar")).toBeInTheDocument();
    expect(screen.getByText("Pintar")).toBeInTheDocument();
    expect(screen.getByText("Aguardando")).toBeInTheDocument();
    expect(screen.getByText("Produzindo")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ana/ })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("updates draft assignees locally when a collaborator is toggled", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();
    const onSave = vi.fn();

    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        teams={teams}
        loading={false}
        dirty
        saving={false}
        onClose={vi.fn()}
        onAssigneesChange={onAssigneesChange}
        onSave={onSave}
      />,
    );

    const assignButtons = screen.getAllByRole("button", { name: "Atribuir Ana" });
    await user.click(assignButtons[0]!);

    expect(onAssigneesChange).toHaveBeenCalledWith(subtasks[0], ["u-1"]);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        teams={teams}
        loading={false}
        dirty
        saving={false}
        onClose={vi.fn()}
        onAssigneesChange={vi.fn()}
        onSave={onSave}
        onAddSubtask={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("places save to the right of add subtask", () => {
    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        teams={teams}
        loading={false}
        dirty
        saving={false}
        onClose={vi.fn()}
        onAssigneesChange={vi.fn()}
        onSave={vi.fn()}
        onAddSubtask={vi.fn()}
      />,
    );

    const addButton = screen.getByRole("button", { name: "Adicionar subtarefa" });
    const saveButton = screen.getByRole("button", { name: "Salvar" });
    expect(
      addButton.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("calls onAddSubtask when add button is clicked", async () => {
    const user = userEvent.setup();
    const onAddSubtask = vi.fn();

    renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="Tarefa A"
        subtasks={subtasks}
        teams={teams}
        loading={false}
        dirty={false}
        saving={false}
        onClose={vi.fn()}
        onAssigneesChange={vi.fn()}
        onSave={vi.fn()}
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
        teams={teams}
        loading={false}
        dirty={false}
        saving={false}
        onClose={onClose}
        onAssigneesChange={vi.fn()}
        onSave={vi.fn()}
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
        teams={teams}
        loading={false}
        dirty={false}
        saving={false}
        onClose={vi.fn()}
        onAssigneesChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Nenhuma subtarefa nesta tarefa.")).toBeInTheDocument();
  });
});
