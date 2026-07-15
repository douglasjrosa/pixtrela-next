import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: vi.fn(async () => []),
}));

import { KanbanSubtaskCreateModal } from "./kanban-subtask-create-modal";

const teams: TeamAssignmentOption[] = [
  {
    documentId: "team-1",
    name: "Equipe A",
    members: [{ documentId: "u-1", name: "Ana" }],
  },
];

describe("KanbanSubtaskCreateModal", () => {
  it("renders form and calls onCreate with valid values on save", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onClose = vi.fn();

    renderWithIntl(
      <KanbanSubtaskCreateModal
        open
        taskName="Tarefa A"
        teams={teams}
        dependencyOptions={[{ documentId: "st-1", name: "Soldar" }]}
        saving={false}
        onClose={onClose}
        onCreate={onCreate}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova subtarefa" })).toBeInTheDocument();
    expect(screen.getByText("Tarefa A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Status de ativação")).not.toBeInTheDocument();
    expect(screen.queryByText("Atribuído a")).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Adicionar subtarefa ao modelo" }),
    ).not.toBeChecked();

    await user.type(screen.getByLabelText("Nome"), "Cortar");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Cortar",
        status: "waiting",
        activationStatus: "unlocked",
        assignedToIds: [],
      }),
      { addToTemplate: false },
    );
  });

  it("passes addToTemplate true when checkbox is checked", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    renderWithIntl(
      <KanbanSubtaskCreateModal
        open
        taskName="Tarefa A"
        teams={teams}
        dependencyOptions={[]}
        saving={false}
        onClose={vi.fn()}
        onCreate={onCreate}
      />,
    );

    await user.type(screen.getByLabelText("Nome"), "Cortar");
    await user.click(
      screen.getByRole("checkbox", { name: "Adicionar subtarefa ao modelo" }),
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cortar" }),
      { addToTemplate: true },
    );
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <KanbanSubtaskCreateModal
        open
        taskName="Tarefa A"
        teams={teams}
        dependencyOptions={[]}
        saving={false}
        onClose={onClose}
        onCreate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
