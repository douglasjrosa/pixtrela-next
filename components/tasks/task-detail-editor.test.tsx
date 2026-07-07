import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TaskDetailEditor } from "./task-detail-editor";

const updateTask = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  updateTask: (...args: unknown[]) => updateTask(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
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

describe("TaskDetailEditor", () => {
  beforeEach(() => {
    updateTask.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    updateTask.mockResolvedValue(undefined);
  });

  it("shows a single floating save button", () => {
    renderWithIntl(
      <TaskDetailEditor
        task={task}
        steps={steps}
        subtasks={[]}
        teams={[]}
        onCreateSubTask={vi.fn()}
        onUpdateSubTask={vi.fn()}
        onReorderSubTasks={vi.fn()}
        onDeleteSubTask={vi.fn()}
      />,
    );

    const saveButtons = screen.getAllByRole("button", { name: "Salvar" });
    expect(saveButtons).toHaveLength(1);
  });

  it("updates task when floating save is clicked", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <TaskDetailEditor
        task={task}
        steps={steps}
        subtasks={[]}
        teams={[]}
        onCreateSubTask={vi.fn()}
        onUpdateSubTask={vi.fn()}
        onReorderSubTasks={vi.fn()}
        onDeleteSubTask={vi.fn()}
      />,
    );

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
