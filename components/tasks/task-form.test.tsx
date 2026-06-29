import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TaskForm } from "./task-form";

const lookupTemplateNameByCode = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  lookupTemplateNameByCode: (...args: unknown[]) =>
    lookupTemplateNameByCode(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

const steps = [{ documentId: "s1", name: "Fila" }];
const defaultValues = {
  name: "Montagem",
  qty: 2,
  deliveryDate: "",
  stepDocumentId: "s1",
  status: "queued" as const,
  templateTaskCode: "",
};

describe("TaskForm", () => {
  beforeEach(() => {
    lookupTemplateNameByCode.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
  });

  it("shows edit title and metrics in edit mode", () => {
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        metrics={{
          totalExpectedTime: 120,
          totalTimeSpent: 60,
          startedAt: null,
          endedAt: null,
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Editar tarefa" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tempo previsto total/)).toBeInTheDocument();
  });

  it("does not show order input in the form", () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Ordem")).not.toBeInTheDocument();
  });

  it("shows create title in create mode", () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nova tarefa" }),
    ).toBeInTheDocument();
  });

  it("does not show a no-step option in the step dropdown", () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByText("Sem etapa")).not.toBeInTheDocument();
  });

  it("selects the queue step by default in create mode", () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={{
          ...defaultValues,
          stepDocumentId: "s1",
        }}
        steps={[
          { documentId: "s1", name: "Na Fila" },
          { documentId: "s2", name: "Produzindo" },
        ]}
        onSubmit={vi.fn()}
      />,
    );

    const stepSelect = screen.getByLabelText("Etapa");
    expect(stepSelect).toHaveValue("s1");
    expect(
      (stepSelect as HTMLSelectElement).selectedOptions[0].textContent,
    ).toBe("Na Fila");
  });

  it("renders template code field before name field", () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    const labels = screen
      .getAllByText(/^(Código do modelo|Nome|Quantidade)$/)
      .map((element) => element.textContent);
    expect(labels.indexOf("Código do modelo")).toBeLessThan(
      labels.indexOf("Nome"),
    );
  });

  it("loads template name into the name field on success", async () => {
    lookupTemplateNameByCode.mockResolvedValue({ name: "Modelo Caixa A" });

    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Código do modelo"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Carregar template" }));

    await waitFor(() => {
      expect(lookupTemplateNameByCode).toHaveBeenCalledWith("123");
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Nome")).toHaveValue("Modelo Caixa A");
    });
    expect(showSuccessToast).toHaveBeenCalledWith(
      "Nome preenchido com o modelo.",
    );
  });

  it("shows error toast when template code is missing", async () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar template" }));

    expect(showErrorToast).toHaveBeenCalledWith(
      "Informe o código do modelo antes de carregar.",
    );
    expect(lookupTemplateNameByCode).not.toHaveBeenCalled();
  });

  it("shows error toast when template lookup fails", async () => {
    lookupTemplateNameByCode.mockRejectedValue(new Error("not_found"));

    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Código do modelo"), {
      target: { value: "999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Carregar template" }));

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith(
        "Não foi possível carregar o modelo.",
      );
    });
  });
});
