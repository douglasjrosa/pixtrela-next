import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TaskEditor } from "./task-editor";

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
  status: "queued" as const,
  active: true,
  totalExpectedTime: 120,
  totalTimeSpent: 60,
  step: { documentId: "s1", name: "Fila" },
};

describe("TaskEditor", () => {
  beforeEach(() => {
    updateTask.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    updateTask.mockResolvedValue(undefined);
  });

  it("renders task edit form with task name prefilled", () => {
    renderWithIntl(<TaskEditor task={task} steps={steps} />);

    expect(screen.getByDisplayValue("Montagem")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Editar tarefa" }),
    ).toBeInTheDocument();
  });

  it("updates task and shows success toast when saving", async () => {
    const user = userEvent.setup();

    renderWithIntl(<TaskEditor task={task} steps={steps} />);

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

  it("shows error toast when update fails", async () => {
    const user = userEvent.setup();
    updateTask.mockRejectedValueOnce(new Error("Strapi request failed"));

    renderWithIntl(<TaskEditor task={task} steps={steps} />);

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(showErrorToast).toHaveBeenCalledWith(
      "Não foi possível concluir a operação.",
    );
  });
});
