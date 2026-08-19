import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

const refresh = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const showLoadingToast = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/(app)/settings/subtasks/actions", () => ({
  listCategoryOptions: vi.fn(async () => []),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showLoadingToast: (...args: unknown[]) => showLoadingToast(...args),
}));

import { renderWithIntl } from "@/test/test-utils";
import { boardSubTaskSummaryStub } from "@/lib/business/board-subtask-summary";
import { resolveKanbanDragEnd, toKanbanTaskId } from "@/lib/business/kanban-task-order";
import {
  FORM_MODAL_NESTED_OVERLAY_Z_CLASS,
  FORM_MODAL_OVERLAY_Z_CLASS,
} from "@/components/ui/form-modal-shell";
import { BoardActions } from "./board-actions";

const paymentCurrency = {
  iconUrl: "https://cdn.example/star.png",
  currencyPerSecond: 2,
  pluralTitle: "Estrelas",
};

function renderBoard(overrides: Partial<ComponentProps<typeof BoardActions>> = {}) {
  return renderWithIntl(
    <BoardActions
      steps={steps}
      tasks={tasks}
      teams={teams}
      assignWarnMax={4}
      assignedCountByColaboratorId={{}}
      paymentCurrency={paymentCurrency}
      applyBoardTaskOrder={vi.fn()}
      loadSubtasks={vi.fn()}
      reorderSubtasks={vi.fn()}
      linkSubtask={vi.fn()}
      updateSubtaskAssignees={vi.fn()}
      createSubtask={vi.fn()}
      {...overrides}
    />,
  );
}

const steps = [
  { id: 1, name: "Fila de produção", taskOrderBy: "manual" as const },
  { id: 2, name: "Produzindo", taskOrderBy: "manual" as const },
];

const tasks = [
  {
    id: 10,
    documentId: "task-10",
    name: "Tarefa A",
    qty: 1,
    status: "waiting" as const,
    stepId: 1,
    index: 0,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  },
  {
    id: 11,
    documentId: "task-11",
    name: "Tarefa B",
    qty: 2,
    status: "waiting" as const,
    stepId: 1,
    index: 1,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
  },
];

const teams = [
  {
    documentId: "team-1",
    name: "Equipe A",
    members: [{ documentId: "u-1", name: "Ana" }],
  },
];

describe("BoardActions", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    showLoadingToast.mockReset();
    showLoadingToast.mockReturnValue("save-toast-id");
  });

  it("renders kanban board with steps", () => {
    renderBoard();
    expect(screen.getByRole("region", { name: "Fila de produção" })).toBeInTheDocument();
    expect(screen.getByText("1 - Tarefa A")).toBeInTheDocument();
  });

  it("opens subtasks modal when a task card is clicked", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks });

    await user.click(screen.getByText("1 - Tarefa A"));

    expect(loadSubtasks).toHaveBeenCalledWith("task-10");
    expect(await screen.findByText("Soldar")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Atribuir Ana" })).toBeInTheDocument();
  });

  it("resolves same-column reorder updates", () => {
    const orderItems = tasks.map((task) => ({
      id: task.id,
      documentId: task.documentId,
      stepId: task.stepId,
      index: task.index,
    }));
    const result = resolveKanbanDragEnd(
      orderItems,
      steps,
      toKanbanTaskId(11),
      toKanbanTaskId(10),
    );
    expect(result.type).toBe("updates");
  });

  it("keeps assignee toggles local until save is clicked", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);
    const updateSubtaskAssignees = vi.fn().mockImplementation(async () => {
      loadSubtasks.mockResolvedValue([
        boardSubTaskSummaryStub({
          documentId: "st-1",
          name: "Soldar",
          status: "waiting",
          assignedTo: [{ documentId: "u-1", name: "Ana" }],
        }),
      ]);
    });

    renderBoard({ loadSubtasks, updateSubtaskAssignees });

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));

    expect(updateSubtaskAssignees).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Remover Ana" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      screen.queryByRole("heading", { name: "Subtarefas" }),
    ).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(updateSubtaskAssignees).toHaveBeenCalledWith("st-1", "task-10", ["u-1"]);
    });
    expect(showLoadingToast).toHaveBeenCalledWith(
      "Atualizando a tarefa 1 - Tarefa A…",
    );
    expect(showSuccessToast).toHaveBeenCalledWith(
      "A tarefa 1 - Tarefa A foi atualizada com sucesso.",
      { toastId: "save-toast-id" },
    );
  });

  it("closes the modal immediately and keeps the board usable while save runs", async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const saveGate = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);
    const updateSubtaskAssignees = vi.fn().mockImplementation(async () => {
      await saveGate;
    });

    renderBoard({ loadSubtasks, updateSubtaskAssignees });

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      screen.queryByRole("heading", { name: "Subtarefas" }),
    ).not.toBeInTheDocument();
    expect(showLoadingToast).toHaveBeenCalledWith(
      "Atualizando a tarefa 1 - Tarefa A…",
    );
    expect(updateSubtaskAssignees).toHaveBeenCalledWith("st-1", "task-10", ["u-1"]);
    expect(showSuccessToast).not.toHaveBeenCalled();
    expect(screen.getByText("1 - Tarefa A")).toBeInTheDocument();

    await user.click(screen.getByText("2 - Tarefa B"));
    expect(await screen.findByRole("heading", { name: "Subtarefas" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fechar" }));

    await act(async () => {
      resolveSave();
    });
    await vi.waitFor(() => {
      expect(showSuccessToast).toHaveBeenCalledWith(
        "A tarefa 1 - Tarefa A foi atualizada com sucesso.",
        { toastId: "save-toast-id" },
      );
    });
  });

  it("toasts an error when background assignee save fails", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);
    const updateSubtaskAssignees = vi.fn().mockRejectedValue(new Error("fail"));

    renderBoard({ loadSubtasks, updateSubtaskAssignees });

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      screen.queryByRole("heading", { name: "Subtarefas" }),
    ).not.toBeInTheDocument();
    await vi.waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith(
        "Não foi possível atualizar a tarefa 1 - Tarefa A.",
        { toastId: "save-toast-id" },
      );
    });
    expect(showSuccessToast).not.toHaveBeenCalled();
  });

  it("opens create modal, saves subtask, and keeps subtasks modal open", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi
      .fn()
      .mockResolvedValueOnce([
        boardSubTaskSummaryStub({
          documentId: "st-1",
          name: "Soldar",
          status: "waiting",
          assignedTo: [],
        }),
      ])
      .mockResolvedValueOnce([
        boardSubTaskSummaryStub({
          documentId: "st-1",
          name: "Soldar",
          status: "waiting",
          assignedTo: [],
        }),
        boardSubTaskSummaryStub({
          documentId: "st-2",
          name: "Cortar",
          status: "waiting",
          assignedTo: [],
        }),
      ]);
    const createSubtask = vi.fn().mockResolvedValue(undefined);

    renderBoard({ loadSubtasks, createSubtask });

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: "Adicionar subtarefa" }));
    expect(screen.getByRole("heading", { name: "Nova subtarefa" })).toBeInTheDocument();

    const createDialog = screen.getByRole("heading", { name: "Nova subtarefa" })
      .closest('[role="dialog"]');
    expect(createDialog).toBeTruthy();

    await user.type(within(createDialog as HTMLElement).getByLabelText("Nome"), "Cortar");
    await user.click(within(createDialog as HTMLElement).getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() => {
      expect(createSubtask).toHaveBeenCalledWith(
        "task-10",
        expect.objectContaining({ name: "Cortar" }),
      );
    });
    expect(
      screen.queryByRole("heading", { name: "Nova subtarefa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Subtarefas" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Cortar")).toBeInTheDocument();
  });

  it("stacks the create overlay above the subtasks modal", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks });

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(
      await screen.findByRole("button", { name: "Adicionar subtarefa" }),
    );

    const createDialog = screen
      .getByRole("heading", { name: "Nova subtarefa" })
      .closest('[role="dialog"]');
    const subtasksDialog = screen
      .getByRole("heading", { name: "Subtarefas" })
      .closest('[role="dialog"]');

    expect(createDialog?.parentElement?.className).toContain(
      FORM_MODAL_NESTED_OVERLAY_Z_CLASS,
    );
    expect(subtasksDialog?.parentElement?.className).toContain(
      FORM_MODAL_OVERLAY_Z_CLASS,
    );
  });

  it("resets create modal when subtasks modal is closed", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks });

    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(
      await screen.findByRole("button", { name: "Adicionar subtarefa" }),
    );
    expect(
      screen.getByRole("heading", { name: "Nova subtarefa" }),
    ).toBeInTheDocument();

    const subtasksDialog = screen
      .getByRole("heading", { name: "Subtarefas" })
      .closest('[role="dialog"]');
    expect(subtasksDialog).toBeTruthy();
    await user.click(
      within(subtasksDialog as HTMLElement).getByRole("button", {
        name: "Fechar",
      }),
    );

    expect(
      screen.queryByRole("heading", { name: "Subtarefas" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Nova subtarefa" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("1 - Tarefa A"));
    expect(
      await screen.findByRole("heading", { name: "Subtarefas" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Nova subtarefa" }),
    ).not.toBeInTheDocument();
  });

  it("persists link-to-previous from the subtasks modal", async () => {
    const user = userEvent.setup();
    let finishLink = (): void => undefined;
    const linkSubtask = vi.fn(
      () =>
        new Promise<{
          documentId: string;
          linkedToPrevious: boolean;
          assignedTo: { documentId: string; name: string }[];
        }>((resolve) => {
          finishLink = () =>
            resolve({
              documentId: "st-2",
              linkedToPrevious: true,
              assignedTo: [{ documentId: "u-1", name: "Ana" }],
            });
        }),
    );
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        index: 0,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        index: 1,
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks, linkSubtask });
    await user.click(screen.getByText("1 - Tarefa A"));
    const toggles = await screen.findAllByRole("button", {
      name: "Ligar à anterior",
    });
    const enabled = toggles.find(
      (toggle) => !toggle.hasAttribute("disabled"),
    );
    expect(enabled).toBeTruthy();
    fireEvent.click(enabled!);
    fireEvent.click(enabled!);
    expect(linkSubtask).toHaveBeenCalledTimes(1);
    expect(linkSubtask).toHaveBeenCalledWith("task-10", "st-2", true);
    await act(async () => {
      finishLink();
    });
    expect(loadSubtasks).toHaveBeenCalledTimes(1);
  });

  it("flushes the last desired link after an in-flight toggle", async () => {
    const user = userEvent.setup();
    const finishQueue: Array<() => void> = [];
    const linkSubtask = vi.fn(
      (
        _taskId: string,
        _subtaskId: string,
        linkedToPrevious: boolean,
      ) =>
        new Promise<{
          documentId: string;
          linkedToPrevious: boolean;
          assignedTo: { documentId: string; name: string }[];
        }>((resolve) => {
          finishQueue.push(() =>
            resolve({
              documentId: "st-2",
              linkedToPrevious,
              assignedTo: [{ documentId: "u-1", name: "Ana" }],
            }),
          );
        }),
    );
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        index: 0,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        index: 1,
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks, linkSubtask });
    await user.click(screen.getByText("1 - Tarefa A"));
    const linkButton = await screen.findByRole("button", {
      name: "Ligar à anterior",
    });
    fireEvent.click(linkButton);
    await vi.waitFor(() => {
      expect(linkSubtask).toHaveBeenCalledTimes(1);
    });
    const unlinkButton = await screen.findByRole("button", {
      name: "Desligar da anterior",
    });
    fireEvent.click(unlinkButton);
    expect(linkSubtask).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishQueue[0]?.();
    });
    await vi.waitFor(() => {
      expect(linkSubtask).toHaveBeenCalledTimes(2);
    });
    expect(linkSubtask).toHaveBeenLastCalledWith("task-10", "st-2", false);
  });

  it("keeps loaded assignee names that are not on a team", async () => {
    const user = userEvent.setup();
    const liveWorkerId = "11111111-1111-1111-1111-111111111111";
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [{ documentId: liveWorkerId, name: "Live Worker" }],
      }),
    ]);

    renderBoard({
      loadSubtasks,
      assigneePeople: [{ documentId: liveWorkerId, name: "Live Worker" }],
    });
    await user.click(screen.getByText("1 - Tarefa A"));
    expect(await screen.findByText("Live Worker")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Ana" }));

    expect(screen.getByText("Live Worker")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover Ana" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(liveWorkerId)).not.toBeInTheDocument();
  });

  it("keeps inherited assignees when the link response returns stale originals", async () => {
    const user = userEvent.setup();
    let finishLink = (): void => undefined;
    const linkSubtask = vi.fn(
      () =>
        new Promise<{
          documentId: string;
          linkedToPrevious: boolean;
          assignedTo: { documentId: string; name: string }[];
        }>((resolve) => {
          finishLink = () =>
            resolve({
              documentId: "st-2",
              linkedToPrevious: true,
              assignedTo: [{ documentId: "u-2", name: "Bia" }],
            });
        }),
    );
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        index: 0,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        index: 1,
        assignedTo: [{ documentId: "u-2", name: "Bia" }],
      }),
    ]);

    renderBoard({ loadSubtasks, linkSubtask });
    await user.click(screen.getByText("1 - Tarefa A"));
    expect(await screen.findByText("Bia")).toBeInTheDocument();
    const linkButton = await screen.findByRole("button", {
      name: "Ligar à anterior",
    });
    fireEvent.click(linkButton);
    expect(screen.getAllByText("Ana").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bia")).not.toBeInTheDocument();

    await act(async () => {
      finishLink();
    });
    expect(screen.getAllByText("Ana").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bia")).not.toBeInTheDocument();
  });

  it("lets a max>1 member add extras but not drop head assignees", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        index: 0,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        index: 1,
        linkedToPrevious: true,
        maxSameTimeWorkers: 2,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
    ]);

    renderBoard({
      loadSubtasks,
      teams: [
        {
          documentId: "team-1",
          name: "Equipe A",
          members: [
            { documentId: "u-1", name: "Ana" },
            { documentId: "u-2", name: "Bob" },
          ],
        },
      ],
    });
    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Cortar/ }));
    await user.click(screen.getByRole("button", { name: "Remover Ana" }));
    expect(screen.getByRole("button", { name: "Remover Ana" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Atribuir Bob" }));
    expect(screen.getByRole("button", { name: "Remover Bob" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover Ana" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remover Bob" }));
    expect(screen.getByRole("button", { name: "Atribuir Bob" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover Ana" })).toBeInTheDocument();
  });

  it("assigns extras only to a max>1 head on the first click", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        index: 0,
        maxSameTimeWorkers: 2,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        index: 1,
        linkedToPrevious: true,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
    ]);

    renderBoard({
      loadSubtasks,
      teams: [
        {
          documentId: "team-1",
          name: "Equipe A",
          members: [
            { documentId: "u-1", name: "Ana" },
            { documentId: "u-2", name: "Bob" },
          ],
        },
      ],
    });
    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Bob" }));
    expect(screen.getByRole("button", { name: "Remover Bob" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cortar/ }));
    expect(screen.getByRole("button", { name: "Atribuir Bob" })).toBeInTheDocument();
  });

  it("propagates removing a shared assignee from a max>1 head", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        index: 0,
        maxSameTimeWorkers: 2,
        assignedTo: [
          { documentId: "u-1", name: "Ana" },
          { documentId: "u-2", name: "Bob" },
        ],
      }),
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        index: 1,
        linkedToPrevious: true,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
    ]);

    renderBoard({
      loadSubtasks,
      teams: [
        {
          documentId: "team-1",
          name: "Equipe A",
          members: [
            { documentId: "u-1", name: "Ana" },
            { documentId: "u-2", name: "Bob" },
          ],
        },
      ],
    });
    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Remover Ana" }));
    expect(screen.getByRole("button", { name: "Remover Bob" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atribuir Ana" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cortar/ }));
    expect(screen.getByRole("button", { name: "Atribuir Ana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atribuir Bob" })).toBeInTheDocument();
  });

  it("propagates head extras after toggling a max>1 head to the group", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        index: 0,
        maxSameTimeWorkers: 2,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
      boardSubTaskSummaryStub({
        documentId: "st-2",
        name: "Cortar",
        status: "waiting",
        index: 1,
        linkedToPrevious: true,
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
    ]);

    renderBoard({
      loadSubtasks,
      teams: [
        {
          documentId: "team-1",
          name: "Equipe A",
          members: [
            { documentId: "u-1", name: "Ana" },
            { documentId: "u-2", name: "Bob" },
          ],
        },
      ],
    });
    await user.click(screen.getByText("1 - Tarefa A"));
    await user.click(await screen.findByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: /Soldar/ }));
    await user.click(screen.getByRole("button", { name: "Atribuir Bob" }));
    await user.click(screen.getByRole("button", { name: /Cortar/ }));
    expect(screen.getByRole("button", { name: "Remover Bob" })).toBeInTheDocument();
  });

  it("shows cached subtasks immediately and refetches in background", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks });

    await user.hover(screen.getByText("1 - Tarefa A"));
    await vi.waitFor(() => {
      expect(loadSubtasks).toHaveBeenCalledWith("task-10");
    });

    loadSubtasks.mockClear();
    await user.click(screen.getByText("1 - Tarefa A"));

    expect(await screen.findByText("Soldar")).toBeInTheDocument();
    expect(loadSubtasks).toHaveBeenCalledWith("task-10");
  });

  it("prefetch does not open the subtasks modal", async () => {
    const user = userEvent.setup();
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks });

    await user.hover(screen.getByText("1 - Tarefa A"));
    await vi.waitFor(() => {
      expect(loadSubtasks).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("heading", { name: "Subtarefas" }),
    ).not.toBeInTheDocument();
  });

  it("shows the subtask list before live producing state arrives", async () => {
    const user = userEvent.setup();
    let releaseLive!: () => void;
    const liveGate = new Promise<void>((resolve) => {
      releaseLive = resolve;
    });
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "producing",
        assignedTo: [{ documentId: "u-1", name: "Ana" }],
      }),
    ]);
    const loadSubtaskLive = vi.fn().mockImplementation(async () => {
      await liveGate;
      return {
        "st-1": {
          producingColaboratorIds: ["u-1"],
          openActivityStartedAts: ["2026-07-16T11:00:00.000Z"],
        },
      };
    });

    renderBoard({ loadSubtasks, loadSubtaskLive });
    await user.click(screen.getByText("1 - Tarefa A"));

    expect(await screen.findByText("Soldar")).toBeInTheDocument();
    expect(loadSubtaskLive).toHaveBeenCalledWith("task-10");
    await act(async () => {
      releaseLive();
    });
  });

  it("prefetches when a card intersects the column", async () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        callback: (entries: { isIntersecting: boolean }[]) => void;
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          this.callback = callback;
        }
        observe(): void {
          this.callback([{ isIntersecting: true }]);
        }
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    const loadSubtasks = vi.fn().mockResolvedValue([
      boardSubTaskSummaryStub({
        documentId: "st-1",
        name: "Soldar",
        status: "waiting",
        assignedTo: [],
      }),
    ]);

    renderBoard({ loadSubtasks });
    await vi.waitFor(() => {
      expect(loadSubtasks).toHaveBeenCalled();
    });
    expect(
      screen.queryByRole("heading", { name: "Subtarefas" }),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("applies in-flight prefetch to the open modal instead of empty state", async () => {
    const user = userEvent.setup();
    let resolvePrefetch!: (value: ReturnType<typeof boardSubTaskSummaryStub>[]) => void;
    const prefetchGate = new Promise<ReturnType<typeof boardSubTaskSummaryStub>[]>(
      (resolve) => {
        resolvePrefetch = resolve;
      },
    );
    const clickGate = new Promise<ReturnType<typeof boardSubTaskSummaryStub>[]>(
      () => undefined,
    );
    let prefetchStarted = false;
    const loadSubtasks = vi.fn().mockImplementation(async (taskId: string) => {
      if (taskId !== "task-10") return [];
      if (!prefetchStarted) {
        prefetchStarted = true;
        return prefetchGate;
      }
      return clickGate;
    });

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        callback: (entries: { isIntersecting: boolean }[]) => void;
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          this.callback = callback;
        }
        observe(): void {
          this.callback([{ isIntersecting: true }]);
        }
        unobserve(): void {}
        disconnect(): void {}
      },
    );

    renderBoard({ loadSubtasks });
    await vi.waitFor(() => {
      expect(loadSubtasks).toHaveBeenCalledWith("task-10");
    });

    await user.click(screen.getByText("1 - Tarefa A"));
    expect(screen.getByTestId("kanban-subtasks-loading")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma subtarefa nesta tarefa."),
    ).not.toBeInTheDocument();

    await act(async () => {
      resolvePrefetch([
        boardSubTaskSummaryStub({
          documentId: "st-1",
          name: "Soldar",
          status: "waiting",
          assignedTo: [],
        }),
      ]);
    });

    expect(await screen.findByText("Soldar")).toBeInTheDocument();
    expect(
      screen.queryByText("Nenhuma subtarefa nesta tarefa."),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
