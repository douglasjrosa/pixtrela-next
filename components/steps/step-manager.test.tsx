import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { resolveStepReorder, StepManager } from "./step-manager";

const steps = [
  { documentId: "s1", name: "Fila", index: 0 },
  { documentId: "s2", name: "Produção", index: 1 },
];

describe("resolveStepReorder", () => {
  it("moves steps when drag ends on another row", () => {
    const next = resolveStepReorder(steps, "s1", "s2");
    expect(next?.map((item) => item.documentId)).toEqual(["s2", "s1"]);
  });

  it("reassigns sequential indexes on affected rows", () => {
    const next = resolveStepReorder(steps, "s1", "s2");
    expect(next?.map((item) => item.index)).toEqual([0, 1]);
    expect(next?.[1]?.documentId).toBe("s1");
  });
});

describe("StepManager", () => {
  it("renders step list without form dialog by default", () => {
    renderWithIntl(
      <StepManager
        steps={steps}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Fila")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show Ordem column in the table", () => {
    renderWithIntl(
      <StepManager
        steps={steps}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).queryByText("Ordem")).not.toBeInTheDocument();
  });

  it("does not show Excluir in the list when only viewing the table", () => {
    renderWithIntl(
      <StepManager
        steps={steps}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("opens create modal when Nova etapa is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <StepManager
        steps={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Nova etapa" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova etapa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ordem")).not.toBeInTheDocument();
  });

  it("opens edit modal when clicking a row and shows Excluir", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <StepManager
        steps={steps}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Fila"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Fila")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Ordem")).not.toBeInTheDocument();
  });

  it("closes modal when close button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <StepManager
        steps={steps}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Nova etapa" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes modal after successful create with name only", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <StepManager
        steps={[]}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Nova etapa" }));
    await user.type(screen.getByLabelText("Nome"), "Corte");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({ name: "Corte" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
