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
  status: "waiting" as const,
  templateTaskCode: "",
};

describe("TaskForm", () => {
  beforeEach(() => {
    lookupTemplateNameByCode.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
  });

  it("shows edit title in edit mode", () => {
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Editar tarefa" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Métricas")).not.toBeInTheDocument();
  });

  it("shows archive reason field when manager starts deactivation", async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        active
        canDeactivate
        onSubmit={vi.fn()}
        onDeactivate={onDeactivate}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Desativar" }));
    expect(onDeactivate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Motivo da desativação")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Excluir" }),
    ).not.toBeInTheDocument();
  });

  it("requires 100 characters before confirming deactivation", async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        active
        canDeactivate
        onSubmit={vi.fn()}
        onDeactivate={onDeactivate}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Desativar" }));
    const reasonField = screen.getByLabelText("Motivo da desativação");
    fireEvent.change(reasonField, { target: { value: "curta" } });
    await user.click(
      screen.getByRole("button", { name: "Confirmar desativação" }),
    );

    expect(onDeactivate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Informe pelo menos 100 caracteres."),
    ).toBeInTheDocument();

    const reason = "x".repeat(100);
    fireEvent.change(reasonField, { target: { value: reason } });
    await user.click(
      screen.getByRole("button", { name: "Confirmar desativação" }),
    );

    expect(onDeactivate).toHaveBeenCalledWith(reason);
  });

  it("hides archive when canDeactivate is false", () => {
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        active
        canDeactivate={false}
        onSubmit={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Desativar" }),
    ).not.toBeInTheDocument();
  });

  it("shows delete action after status when task is inactive", () => {
    const onDelete = vi.fn();
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        active={false}
        canDelete
        onSubmit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("shows archive as reactivate when inactive for manager+", async () => {
    const user = userEvent.setup();
    const onReactivate = vi.fn();
    const previousReason = "y".repeat(100);

    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        active={false}
        canDeactivate
        reasonForDeactivation={previousReason}
        onSubmit={vi.fn()}
        onReactivate={onReactivate}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Desativar" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reativar" }));

    const reasonField = screen.getByLabelText("Motivo da desativação");
    expect(reasonField).toHaveValue(previousReason);

    const updatedReason = "z".repeat(100);
    fireEvent.change(reasonField, { target: { value: updatedReason } });
    await user.click(
      screen.getByRole("button", { name: "Confirmar reativação" }),
    );

    expect(onReactivate).toHaveBeenCalledWith(updatedReason);
  });

  it("hides delete when canDelete is false", () => {
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        active={false}
        canDelete={false}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Excluir" }),
    ).not.toBeInTheDocument();
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
