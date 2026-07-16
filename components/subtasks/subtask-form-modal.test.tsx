import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { SubTaskFormModal } from "./subtask-form-modal";

afterEach(() => {
  cleanup();
});

describe("SubTaskFormModal", () => {
  it("shows clone and remove in the header when handlers are provided", () => {
    renderWithIntl(
      <SubTaskFormModal
        open
        title="Editar"
        onClose={vi.fn()}
        onClone={vi.fn()}
        onRemove={vi.fn()}
      >
        <p>Form body</p>
      </SubTaskFormModal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Clonar subtarefa" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Remover subtarefa" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Fechar" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("hides clone and remove when handlers are omitted", () => {
    renderWithIntl(
      <SubTaskFormModal open title="Nova subtarefa" onClose={vi.fn()}>
        <p>Form body</p>
      </SubTaskFormModal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).queryByRole("button", { name: "Clonar subtarefa" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Remover subtarefa" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Fechar" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("calls onClone and onRemove from header actions", async () => {
    const user = userEvent.setup();
    const onClone = vi.fn();
    const onRemove = vi.fn();

    renderWithIntl(
      <SubTaskFormModal
        open
        title="Editar"
        onClose={vi.fn()}
        onClone={onClone}
        onRemove={onRemove}
      >
        <p>Form body</p>
      </SubTaskFormModal>,
    );

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Clonar subtarefa" }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Remover subtarefa" }),
    );

    expect(onClone).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the OK footer button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <SubTaskFormModal open title="Editar" onClose={onClose}>
        <p>Form body</p>
      </SubTaskFormModal>,
    );

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "OK" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders optional subtitle under the title", () => {
    renderWithIntl(
      <SubTaskFormModal
        open
        title="Editar subtarefa"
        subtitle="1 - Beccaro - Misturadeira 25kg"
        onClose={vi.fn()}
      >
        <p>Form body</p>
      </SubTaskFormModal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Editar subtarefa" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("1 - Beccaro - Misturadeira 25kg"),
    ).toBeInTheDocument();
  });
});
