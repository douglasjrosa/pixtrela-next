import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { NextIntlClientProvider } from "next-intl";

import type { TeamAssignmentOption } from "@/components/subtasks/subtask-manager";
import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";
import messages from "@/messages/pt-BR.json";
import { renderWithIntl } from "@/test/test-utils";
import { KanbanTaskSubtasksModal } from "./kanban-task-subtasks-modal";

const showSuccessToast = vi.fn();
const showHintToast = vi.fn();
const showConfirmToast = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: vi.fn(),
  showHintToast: (...args: unknown[]) => showHintToast(...args),
  showConfirmToast: (...args: unknown[]) => showConfirmToast(...args),
}));

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
        qty: 5,
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
      paymentCurrency={{
        iconUrl: "https://cdn.example/star.png",
        currencyPerSecond: 2,
        pluralTitle: "Estrelas",
      }}
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
  beforeEach(() => {
    showSuccessToast.mockReset();
    showHintToast.mockReset();
    showConfirmToast.mockReset();
  });

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
    expect(screen.queryByText("Histórico")).not.toBeInTheDocument();
  });

  it("selects pending tab by default when pending subtasks exist", () => {
    renderModal();

    expect(screen.getByRole("tab", { name: "Pendentes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Finalizadas" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("hides finished tab when there are no finished subtasks", () => {
    renderModal({
      subtasks: subtasks.filter((item) => item.status !== "finished"),
    });

    expect(screen.getByRole("tab", { name: "Pendentes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.queryByRole("tab", { name: "Finalizadas" }),
    ).not.toBeInTheDocument();
  });

  it("selects pending after subtasks load when pending items appear", () => {
    const view = renderWithIntl(
      <KanbanTaskSubtasksModal
        open
        taskName="1 - Tarefa A"
        subtasks={[]}
        teams={teams}
        assignWarnMax={4}
        assignedCountByColaboratorId={{ "u-1": 3 }}
        loading={false}
        dirty={false}
        saving={false}
        onClose={vi.fn()}
        onAssigneesChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("tab", { name: "Pendentes" }),
    ).not.toBeInTheDocument();

    view.rerender(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
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
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("tab", { name: "Pendentes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("hides pending tab and shows finished when there are no pending subtasks", () => {
    renderModal({
      subtasks: subtasks.filter((item) => item.status === "finished"),
    });

    expect(
      screen.queryByRole("tab", { name: "Pendentes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Finalizadas" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Embalar")).toBeInTheDocument();
    expect(screen.queryByText("Histórico")).not.toBeInTheDocument();
    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("progressbar", {
        name: "Progresso em relação ao tempo previsto",
      }),
    ).not.toBeInTheDocument();
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
    expect(screen.getByLabelText("1 colaborador(es)")).toBeInTheDocument();
    expect(screen.getByLabelText(/Finalizada em/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tempo estimado/)).toBeInTheDocument();
    expect(screen.queryByText("Histórico")).not.toBeInTheDocument();
    expect(screen.queryByText("Total por colaborador")).not.toBeInTheDocument();
    expect(screen.queryByText("Soldar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Atribuir Ana" }),
    ).not.toBeInTheDocument();
  });

  it("opens info modal with totals above sessions when a finished subtask is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("tab", { name: "Finalizadas" }));
    await user.click(screen.getByRole("button", { name: /Embalar/ }));

    expect(
      screen.getByRole("heading", { name: "Detalhes" }),
    ).toBeInTheDocument();
    const detailsDialog = screen.getByRole("heading", { name: "Detalhes" })
      .closest("[role='dialog']");
    expect(detailsDialog).not.toBeNull();
    expect(
      within(detailsDialog as HTMLElement).getByLabelText("120 Estrelas"),
    ).toBeInTheDocument();
    expect(
      within(detailsDialog as HTMLElement).getByLabelText(/Tempo estimado/),
    ).toBeInTheDocument();
    expect(
      within(detailsDialog as HTMLElement).getByLabelText(/Tempo gasto/),
    ).toBeInTheDocument();
    expect(
      within(detailsDialog as HTMLElement).getByLabelText(/Tempo ganho/),
    ).toBeInTheDocument();
    const sessionsHeading = within(detailsDialog as HTMLElement).getByRole(
      "heading",
      { name: "Histórico" },
    );
    const totalsHeading = within(detailsDialog as HTMLElement).getByRole(
      "heading",
      { name: "Total por colaborador" },
    );
    expect(
      totalsHeading.compareDocumentPosition(sessionsHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

  it("shows hint toast when clicking a worker without a selected subtask", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));

    expect(showHintToast).toHaveBeenCalledWith(
      "Primeiro, escolha uma Subtarefa.",
    );
    expect(onAssigneesChange).not.toHaveBeenCalled();
  });

  it("shows hint toast when clicking a team without a selected subtask", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(
      screen.getByRole("button", {
        name: "Marcar ou desmarcar todos de Equipe A",
      }),
    );

    expect(showHintToast).toHaveBeenCalledWith(
      "Primeiro, escolha uma Subtarefa.",
    );
    expect(onAssigneesChange).not.toHaveBeenCalled();
  });

  it("shows hint toast when clicking a subtask without a selected collaborator in teams mode", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("button", { name: "Equipes" }));
    await user.click(screen.getByRole("button", { name: /Soldar/ }));

    expect(showHintToast).toHaveBeenCalledWith(
      "Primeiro, escolha um Colaborador.",
    );
    expect(onAssigneesChange).not.toHaveBeenCalled();
  });

  it("asks before closing when the form is dirty", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ dirty: true, onClose });

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(showConfirmToast).toHaveBeenCalledOnce();
    const options = showConfirmToast.mock.calls[0][0] as {
      message: string;
      yesLabel: string;
      noLabel: string;
      onYes: () => void;
    };
    expect(options.message).toBe(
      "Tem certeza de que deseja sair da página sem salvar?",
    );
    expect(options.yesLabel).toBe("Sim");
    expect(options.noLabel).toBe("Não");

    options.onYes();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("asks before going to finished when the form is dirty", async () => {
    const user = userEvent.setup();
    renderModal({ dirty: true });

    await user.click(screen.getByRole("tab", { name: "Finalizadas" }));

    expect(showConfirmToast).toHaveBeenCalledOnce();
    expect(screen.getByRole("tab", { name: "Pendentes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const options = showConfirmToast.mock.calls[0][0] as {
      onYes: () => void;
    };
    await act(async () => {
      options.onYes();
    });
    expect(screen.getByRole("tab", { name: "Finalizadas" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("asks before adding a subtask when the form is dirty", async () => {
    const user = userEvent.setup();
    const onAddSubtask = vi.fn();

    renderModal({ dirty: true, onAddSubtask });

    await user.click(screen.getByRole("button", { name: "Adicionar subtarefa" }));

    expect(onAddSubtask).not.toHaveBeenCalled();
    expect(showConfirmToast).toHaveBeenCalledOnce();

    const options = showConfirmToast.mock.calls[0][0] as {
      onYes: () => void;
    };
    await act(async () => {
      options.onYes();
    });
    expect(onAddSubtask).toHaveBeenCalledOnce();
  });

  it("asks before enabling multi-select when the form is dirty", async () => {
    const user = userEvent.setup();
    renderModal({ dirty: true });

    await user.click(screen.getByRole("switch", { name: "Multi-seleção" }));

    expect(showConfirmToast).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("button", { name: "Atribuir subtarefas" }),
    ).not.toBeInTheDocument();

    const options = showConfirmToast.mock.calls[0][0] as {
      onYes: () => void;
    };
    await act(async () => {
      options.onYes();
    });
    expect(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    ).toBeInTheDocument();
  });

  it("closes immediately when the form is not dirty", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ dirty: false, onClose });

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(showConfirmToast).not.toHaveBeenCalled();
  });

  it("keeps 1:1 assign when multi switch is off", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));

    expect(onAssigneesChange).toHaveBeenCalledWith(subtasks[0], ["u-1"]);
  });

  it("in multi mode treats column headers as labels and does not mutate until assign", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("switch", { name: "Multi-seleção" }));

    expect(
      screen.queryByRole("button", { name: "Subtarefas", pressed: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Subtarefas", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Equipes", { selector: "p" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Ana" }));

    expect(onAssigneesChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    ).toBeEnabled();
  });

  it("disables multi actions until both sides have a selection", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("switch", { name: "Multi-seleção" }));

    expect(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    expect(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Ana" }));
    expect(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    ).toBeEnabled();
  });

  it("assigns only missing pairs then clears multi state", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("switch", { name: "Multi-seleção" }));
    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: /Pintar/ }));
    await user.click(screen.getByRole("button", { name: "Ana" }));
    await user.click(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    );

    expect(onAssigneesChange).toHaveBeenCalledWith(subtasks[0], ["u-1"]);
    // Pintar already has Ana — no update for no-op
    expect(onAssigneesChange).toHaveBeenCalledTimes(1);
    expect(showSuccessToast).toHaveBeenCalledWith(
      "2 subtarefas foram atribuídas a 1 colaboradores.",
    );
    expect(
      screen.queryByRole("button", { name: "Atribuir subtarefas" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Multi-seleção" })).not.toBeChecked();
  });

  it("removes only assigned pairs then clears multi state", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("switch", { name: "Multi-seleção" }));
    await user.click(screen.getByRole("button", { name: /Pintar/ }));
    await user.click(screen.getByRole("button", { name: "Ana" }));
    await user.click(
      screen.getByRole("button", { name: "Remover atribuições" }),
    );

    expect(onAssigneesChange).toHaveBeenCalledWith(subtasks[1], []);
    expect(
      screen.queryByRole("button", { name: "Remover atribuições" }),
    ).not.toBeInTheDocument();
  });

  it("uses team name as a shortcut for worker selection in multi mode", async () => {
    const user = userEvent.setup();
    const onAssigneesChange = vi.fn();

    renderModal({ onAssigneesChange });

    await user.click(screen.getByRole("switch", { name: "Multi-seleção" }));
    await user.click(
      screen.getByRole("button", {
        name: "Marcar ou desmarcar todos de Equipe A",
      }),
    );
    await user.click(screen.getByRole("button", { name: /Soldar/ }));

    expect(onAssigneesChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Ana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Bob" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    ).toBeEnabled();
  });

  it("asks before leaving multi with a selection", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("switch", { name: "Multi-seleção" }));
    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("tab", { name: "Finalizadas" }));

    expect(
      screen.getByRole("heading", { name: "Sair da multi-seleção" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Não" }));
    expect(screen.getByRole("tab", { name: "Pendentes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("switch", { name: "Multi-seleção" })).toHaveAttribute(
      "data-checked",
    );

    await user.click(screen.getByRole("tab", { name: "Finalizadas" }));
    await user.click(screen.getByRole("button", { name: "Sim" }));
    expect(screen.getByRole("tab", { name: "Finalizadas" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
