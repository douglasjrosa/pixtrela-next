import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TaskManager } from "./task-manager";

const createTask = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();
const push = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
  lookupTemplateNameByCode: vi.fn(),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
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
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    push.mockReset();
    createTask.mockResolvedValue(undefined);
  });

  it("hides task form by default", () => {
    renderWithIntl(<TaskManager tasks={tasks} steps={steps} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("renders task list without action column", () => {
    renderWithIntl(<TaskManager tasks={tasks} steps={steps} />);
    expect(screen.getByRole("link", { name: "Montagem" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desativar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    expect(screen.getByText("12/06/2026")).toBeInTheDocument();
  });

  it("navigates to task detail when a row is activated", () => {
    renderWithIntl(<TaskManager tasks={tasks} steps={steps} />);
    fireEvent.click(screen.getByRole("link", { name: "Montagem" }));
    expect(push).toHaveBeenCalledWith("/tasks/t1");
  });

  it("opens create modal when Nova tarefa is clicked", () => {
    renderWithIntl(<TaskManager tasks={[]} steps={steps} />);
    fireEvent.click(screen.getByRole("button", { name: "Nova tarefa" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nova tarefa" }),
    ).toBeInTheDocument();
  });

  it("closes create modal on cancel", () => {
    renderWithIntl(<TaskManager tasks={[]} steps={steps} />);
    fireEvent.click(screen.getByRole("button", { name: "Nova tarefa" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates a task, closes modal and shows success toast", async () => {
    const user = userEvent.setup();

    renderWithIntl(<TaskManager tasks={[]} steps={steps} />);

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

  it("shows error toast when create fails", async () => {
    const user = userEvent.setup();
    createTask.mockRejectedValueOnce(new Error("Strapi request failed"));

    renderWithIntl(<TaskManager tasks={[]} steps={steps} />);

    await user.click(screen.getByRole("button", { name: "Nova tarefa" }));
    await user.type(screen.getByLabelText("Nome"), "Nova tarefa");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(showErrorToast).toHaveBeenCalledWith(
      "Não foi possível concluir a operação.",
    );
  });
});
