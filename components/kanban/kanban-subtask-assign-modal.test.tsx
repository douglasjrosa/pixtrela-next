import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KanbanSubtaskAssignModal } from "./kanban-subtask-assign-modal";
import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";

const teams: TeamAssignmentOption[] = [
  {
    documentId: "team-1",
    name: "Equipe A",
    members: [{ documentId: "u-1", name: "Ana" }],
  },
];

describe("KanbanSubtaskAssignModal", () => {
  it("renders assignee picker and saves selected collaborators", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();

    renderWithIntl(
      <KanbanSubtaskAssignModal
        open
        subtaskName="Soldar"
        teams={teams}
        assignedToIds={[]}
        saving={false}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Soldar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith(["u-1"]);
  });
});
