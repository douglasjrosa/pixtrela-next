import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";
import { renderWithIntl } from "@/test/test-utils";
import { KanbanTaskSubtasksModal } from "./kanban-task-subtasks-modal";

const teams: TeamAssignmentOption[] = [
  {
    documentId: "team-1",
    name: "Equipe A",
    members: [
      { documentId: "u-1", name: "Ana" },
      { documentId: "u-2", name: "Bob" },
    ],
  },
];

const subtasks = [
  boardSubTaskSummaryStub({
    documentId: "st-1",
    name: "Soldar",
    status: "waiting",
    assignedTo: [],
  }),
  boardSubTaskSummaryStub({
    documentId: "st-2",
    name: "Pintar",
    status: "producing",
    expectedTime: 120,
    timeSpent: 30,
    openActivityStartedAts: ["2026-07-16T11:00:00.000Z"],
    assignedTo: [{ documentId: "u-1", name: "Ana" }],
  }),
  boardSubTaskSummaryStub({
    documentId: "st-3",
    name: "Embalar",
    status: "finished",
    expectedTime: 60,
    timeSpent: 60,
    sessions: [
      {
        colaboratorDocumentId: "u-1",
        colaboratorName: "Ana",
        startedAt: "2026-07-16T10:00:00.000Z",
        finishedAt: "2026-07-16T10:01:00.000Z",
        durationSec: 60,
        qty: 0,
      },
    ],
    assignedTo: [],
  }),
];

function renderModal(
  overrides: Partial<ComponentProps<typeof KanbanTaskSubtasksModal>> = {},
) {
  return renderWithIntl(
    <KanbanTaskSubtasksModal
      open
      taskName="1 - Tarefa A"
      subtasks={subtasks}
      teams={teams}
      assignWarnMax={4}
      assignedCountByColaboratorId={{ "u-1": 3 }}
      loading={false}
      dirty={false}
      saving={false}
      onClose={vi.fn()}
      onAssigneesChange={vi.fn()}
      onSave={vi.fn()}
      {...overrides}
    />,
  );
}

describe("KanbanTaskSubtasksModal", () => {
  it("shows pending tab by default without finished subtasks", () => {
    renderModal();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Subtarefas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 - Tarefa A")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pendentes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Soldar")).toBeInTheDocument();
    expect(screen.getByText("Pintar")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Produzindo · 1 em atividade"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("1 subtarefa(s) sem colaborador"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Ana: 3 subtarefa(s) atribuída(s)"),
    ).toHaveTextContent("3");
    expect(screen.queryByText("1/1")).not.toBeInTheDocument();
    expect(screen.queryByText("0/0")).not.toBeInTheDocument();
    expect(screen.queryByText("Embalar")).not.toBeInTheDocument();
    expect(screen.queryByText("Sessões")).not.toBeInTheDocument();
  });

  it("hides assign-warn badge when count is above assignWarnMax", () => {
    renderModal({
      assignWarnMax: 4,
      assignedCountByColaboratorId: { "u-1": 5, "u-2": 0 },
    });

    expect(
      screen.queryByLabelText(/subtarefa\(s\) atribuída\(s\)/),
    ).not.toBeInTheDocument();
  });

  it("hides assign-warn badge when count is zero", () => {
    renderModal({
      assignedCountByColaboratorId: { "u-1": 0 },
    });

    expect(
      screen.queryByLabelText(/subtarefa\(s\) atribuída\(s\)/),
    ).not.toBeInTheDocument();
  });

  it("shows finished subtasks with sessions on the finished tab", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("tab", { name: "Finalizadas" }));

    expect(screen.getByText("Embalar")).toBeInTheDocument();
    expect(screen.getByText("Sessões")).toBeInTheDocument();
    expect(screen.queryByText("Soldar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Atribuir Ana" }),
    ).not.toBeInTheDocument();
  });

  it("in subtasks mode assigns collaborators to the selected subtask only", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();
    const onSave = vi.fn();

    renderModal({
      dirty: true,
      onAssigneesChange,
      onSave,
    });

    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));

    expect(onAssigneesChange).toHaveBeenCalledWith(subtasks[0], ["u-1"]);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("in teams mode toggles multiple subtasks for one collaborator", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("button", { name: "Equipes" }));
    await user.click(screen.getByRole("button", { name: "Ana" }));
    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: /Pintar/ }));

    expect(onAssigneesChange).toHaveBeenNthCalledWith(1, subtasks[0], ["u-1"]);
    expect(onAssigneesChange).toHaveBeenNthCalledWith(2, subtasks[1], []);
  });

  it("does nothing when team name is clicked in teams mode", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("button", { name: "Equipes" }));
    expect(
      screen.queryByRole("button", {
        name: "Marcar ou desmarcar todos de Equipe A",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Equipe A")).toBeInTheDocument();
    expect(onAssigneesChange).not.toHaveBeenCalled();
  });

  it("highlights assigned subtasks when a collaborator is selected in teams mode", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Equipes" }));
    await user.click(screen.getByRole("button", { name: "Ana" }));

    expect(screen.getByRole("button", { name: /Pintar/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Soldar/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderModal({ dirty: true, onSave, onAddSubtask: vi.fn() });

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("calls onAddSubtask when add button is clicked", async () => {
    const user = userEvent.setup();
    const onAddSubtask = vi.fn();

    renderModal({ onAddSubtask });

    await user.click(screen.getByRole("button", { name: "Adicionar subtarefa" }));
    expect(onAddSubtask).toHaveBeenCalledOnce();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows empty state when there are no sub-tasks", () => {
    renderModal({ subtasks: [], taskName: "Tarefa B" });

    expect(
      screen.getByText("Nenhuma subtarefa nesta tarefa."),
    ).toBeInTheDocument();
  });

  it("keeps teams column disabled until a subtask is selected in subtasks mode", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Atribuir Ana" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Atribuir Bob" })).toBeDisabled();
  });
});
