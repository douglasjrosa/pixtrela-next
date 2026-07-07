import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TaskManager } from "./task-manager";

const createTask = vi.fn();
const updateTask = vi.fn();
const deactivateTask = vi.fn();
const deleteTask = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
  updateTask: (...args: unknown[]) => updateTask(...args),
  deactivateTask: (...args: unknown[]) => deactivateTask(...args),
  deleteTask: (...args: unknown[]) => deleteTask(...args),
  lookupTemplateNameByCode: vi.fn(),
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
    status: "waiting" as const,
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
    updateTask.mockReset();
    deactivateTask.mockReset();
    deleteTask.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    createTask.mockResolvedValue(undefined);
    updateTask.mockResolvedValue(undefined);
  });

  it("hides task form by default", () => {
    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete={false} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("renders task list with manage subtasks link", () => {
    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete={false} />,
    );
    expect(screen.getByRole("button", { name: "Montagem" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Gerenciar subtarefas" }),
    ).toHaveAttribute("href", "/tasks/t1");
    expect(screen.getByText("12/06/2026")).toBeInTheDocument();
  });

  it("opens create modal when Nova tarefa is clicked", () => {
    renderWithIntl(
      <TaskManager tasks={[]} steps={steps} canDelete={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Nova tarefa" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nova tarefa" }),
    ).toBeInTheDocument();
  });

  it("opens edit modal when task name is clicked", () => {
    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Montagem" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Editar tarefa" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Montagem");
  });

  it("closes modal on cancel", () => {
    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete={false} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Montagem" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates a task, closes modal and shows success toast", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <TaskManager tasks={[]} steps={steps} canDelete={false} />,
    );

    await user.click(screen.getByRole("button", { name: "Nova tarefa" }));
    await user.type(screen.getByLabelText("Nome"), "Nova tarefa");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Nova tarefa",
        qty: 1,
        stepDocumentId: "s1",
      }),
    );
    expect(showSuccessToast).toHaveBeenCalledWith("Tarefa salva com sucesso.");
    expect(refresh).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("updates a task when saving from edit modal", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete={false} />,
    );

    await user.click(screen.getByRole("button", { name: "Montagem" }));
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Montagem revisada");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(updateTask).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({ name: "Montagem revisada", qty: 2 }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows error toast when create fails", async () => {
    const user = userEvent.setup();
    createTask.mockRejectedValueOnce(new Error("Strapi request failed"));

    renderWithIntl(
      <TaskManager tasks={[]} steps={steps} canDelete={false} />,
    );

    await user.click(screen.getByRole("button", { name: "Nova tarefa" }));
    await user.type(screen.getByLabelText("Nome"), "Nova tarefa");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(showErrorToast).toHaveBeenCalledWith(
      "Não foi possível concluir a operação.",
    );
  });
});
