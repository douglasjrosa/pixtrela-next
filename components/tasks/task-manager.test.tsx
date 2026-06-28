import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TaskManager } from "./task-manager";

const createTask = vi.fn();
const deactivateTask = vi.fn();
const deleteTask = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
  deactivateTask: (...args: unknown[]) => deactivateTask(...args),
  deleteTask: (...args: unknown[]) => deleteTask(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const steps = [{ documentId: "s1", name: "Fila" }];
const tasks = [
  {
    documentId: "t1",
    name: "Montagem",
    qty: 2,
    index: 0,
    status: "queued" as const,
    active: true,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
    deliveryDate: "2026-06-12",
    step: { documentId: "s1", name: "Fila" },
  },
];

describe("TaskManager", () => {
  beforeEach(() => {
    createTask.mockReset();
    deactivateTask.mockReset();
    deleteTask.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    createTask.mockResolvedValue(undefined);
  });

  it("renders task list with link to detail page", () => {
    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete={false} />,
    );
    const link = screen.getByRole("link", { name: "Montagem" });
    expect(link).toHaveAttribute("href", "/tasks/t1");
    expect(screen.getByText("12/06/2026")).toBeInTheDocument();
  });

  it("creates a task and shows success toast", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <TaskManager tasks={[]} steps={steps} canDelete={false} />,
    );

    await user.type(screen.getByLabelText("Nome"), "Nova tarefa");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Nova tarefa", qty: 1 }),
    );
    expect(showSuccessToast).toHaveBeenCalledWith("Tarefa salva com sucesso.");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows error toast when create fails", async () => {
    const user = userEvent.setup();
    createTask.mockRejectedValueOnce(new Error("Strapi request failed"));

    renderWithIntl(
      <TaskManager tasks={[]} steps={steps} canDelete={false} />,
    );

    await user.type(screen.getByLabelText("Nome"), "Nova tarefa");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(showErrorToast).toHaveBeenCalledWith(
      "Não foi possível concluir a operação.",
    );
  });
});
