import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("does not render when closed", () => {
    renderWithIntl(
      <ConfirmDialog
        open={false}
        title="Excluir tarefa"
        description="Excluir permanentemente esta tarefa?"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms and closes from dialog actions", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderWithIntl(
      <ConfirmDialog
        open
        title="Excluir tarefa"
        description="Excluir permanentemente esta tarefa?"
        confirmLabel="Excluir"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("Excluir permanentemente esta tarefa?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
