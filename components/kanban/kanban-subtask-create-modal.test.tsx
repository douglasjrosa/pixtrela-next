import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KanbanSubtaskCreateModal } from "./kanban-subtask-create-modal";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";

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
        dependencyOptions={[
          { documentId: "st-1", name: "Soldar" },
        ]}
        saving={false}
        onClose={onClose}
        onCreate={onCreate}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova subtarefa" })).toBeInTheDocument();
    expect(screen.getByText("Tarefa A")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nome"), "Cortar");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cortar" }),
    );
  });

  it("calls onClose when cancel is clicked", async () => {
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

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
