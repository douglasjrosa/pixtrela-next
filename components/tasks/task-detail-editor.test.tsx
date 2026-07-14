import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: vi.fn(async () => []),
}));

import { TaskDetailEditor } from "./task-detail-editor";

const updateTask = vi.fn();
const deactivateTask = vi.fn();
const reactivateTask = vi.fn();
const deleteTask = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();
const push = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  updateTask: (...args: unknown[]) => updateTask(...args),
  deactivateTask: (...args: unknown[]) => deactivateTask(...args),
  reactivateTask: (...args: unknown[]) => reactivateTask(...args),
  deleteTask: (...args: unknown[]) => deleteTask(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

const steps = [{ documentId: "s1", name: "Fila" }];
const task = {
  documentId: "t1",
  name: "Montagem",
  qty: 2,
  index: 0,
  status: "waiting" as const,
  active: true,
  totalExpectedTime: 120,
  totalTimeSpent: 60,
  step: { documentId: "s1", name: "Fila" },
};

const editorProps = {
  task,
  steps,
  subtasks: [] as const,
  teams: [] as const,
  canDeactivate: true,
  canDelete: false,
  onCreateSubTask: vi.fn(),
  onUpdateSubTask: vi.fn(),
  onReorderSubTasks: vi.fn(),
  onDeleteSubTask: vi.fn(),
};

describe("TaskDetailEditor", () => {
  beforeEach(() => {
    updateTask.mockReset();
    deactivateTask.mockReset();
    reactivateTask.mockReset();
    deleteTask.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    push.mockReset();
    updateTask.mockResolvedValue(undefined);
    deactivateTask.mockResolvedValue(undefined);
    reactivateTask.mockResolvedValue(undefined);
    deleteTask.mockResolvedValue(undefined);
  });

  it("shows a single floating save button", () => {
    renderWithIntl(<TaskDetailEditor {...editorProps} />);

    const saveButtons = screen.getAllByRole("button", { name: "Salvar" });
    expect(saveButtons).toHaveLength(1);
  });

  it("updates task when floating save is clicked", async () => {
    const user = userEvent.setup();

    renderWithIntl(<TaskDetailEditor {...editorProps} />);

    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Montagem revisada");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(updateTask).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({ name: "Montagem revisada", qty: 2 }),
    );
    expect(showSuccessToast).toHaveBeenCalledWith("Tarefa salva com sucesso.");
    expect(refresh).toHaveBeenCalled();
  });

  it("deactivates task with reason from detail actions", async () => {
    const user = userEvent.setup();
    const reason = "x".repeat(100);

    renderWithIntl(<TaskDetailEditor {...editorProps} />);

    await user.click(screen.getByRole("button", { name: "Desativar" }));
    fireEvent.change(screen.getByLabelText("Motivo da desativação"), {
      target: { value: reason },
    });
    await user.click(
      screen.getByRole("button", { name: "Confirmar desativação" }),
    );

    expect(deactivateTask).toHaveBeenCalledWith("t1", reason);
    expect(showSuccessToast).toHaveBeenCalledWith("Tarefa desativada.");
  });

  it("reactivates inactive task with editable saved reason", async () => {
    const user = userEvent.setup();
    const previousReason = "y".repeat(100);
    const updatedReason = "z".repeat(100);

    renderWithIntl(
      <TaskDetailEditor
        {...editorProps}
        task={{
          ...task,
          active: false,
          reasonForDeactivation: previousReason,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reativar" }));
    expect(screen.getByLabelText("Motivo da desativação")).toHaveValue(
      previousReason,
    );

    fireEvent.change(screen.getByLabelText("Motivo da desativação"), {
      target: { value: updatedReason },
    });
    await user.click(
      screen.getByRole("button", { name: "Confirmar reativação" }),
    );

    expect(reactivateTask).toHaveBeenCalledWith("t1", updatedReason);
    expect(showSuccessToast).toHaveBeenCalledWith("Tarefa reativada.");
  });

  it("asks for confirmation before deleting an inactive task", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <TaskDetailEditor
        {...editorProps}
        task={{ ...task, active: false }}
        canDeactivate={false}
        canDelete
      />,
    );

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(deleteTask).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Excluir permanentemente esta tarefa?"),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteTask).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Excluir",
      }),
    );

    expect(deleteTask).toHaveBeenCalledWith("t1");
    expect(push).toHaveBeenCalledWith("/tasks");
  });
});
