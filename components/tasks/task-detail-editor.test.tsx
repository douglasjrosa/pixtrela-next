import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: vi.fn(async () => []),
}));

vi.mock("@/app/(app)/settings/subtasks/actions", () => ({
  listCategoryOptions: vi.fn(async () => []),
}));

import { TaskDetailEditor } from "./task-detail-editor";

const updateTask = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();
const push = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  updateTask: (...args: unknown[]) => updateTask(...args),
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
  deliveryDate: "2026-07-20",
  totalExpectedTime: 120,
  totalTimeSpent: 60,
  step: { documentId: "s1", name: "Fila" },
};

const editorProps = {
  task,
  steps,
  subtasks: [] as const,
  teams: [] as const,
  onCreateSubTask: vi.fn(),
  onUpdateSubTask: vi.fn(),
  onReorderSubTasks: vi.fn(),
  onDeleteSubTask: vi.fn(),
};

describe("TaskDetailEditor", () => {
  beforeEach(() => {
    updateTask.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    push.mockReset();
    updateTask.mockResolvedValue(undefined);
  });

  it("shows a single floating save button", () => {
    renderWithIntl(<TaskDetailEditor {...editorProps} />);

    const saveButtons = screen.getAllByRole("button", { name: "Salvar" });
    expect(saveButtons).toHaveLength(1);
  });

  it("does not show deactivate or delete controls on the detail form", () => {
    renderWithIntl(<TaskDetailEditor {...editorProps} />);

    expect(
      screen.queryByRole("button", { name: "Desativar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir" }),
    ).not.toBeInTheDocument();
  });

  it("does not show a manual step (Etapa) select on the detail form", () => {
    renderWithIntl(<TaskDetailEditor {...editorProps} />);

    expect(screen.queryByLabelText("Etapa")).not.toBeInTheDocument();
    expect(document.getElementById("task-detail-form")).toBeTruthy();
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
});
