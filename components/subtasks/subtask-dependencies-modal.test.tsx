import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { FORM_MODAL_DIALOG_OVERLAY_Z_CLASS } from "@/components/ui/form-modal-shell";
import { SubTaskDependenciesModal } from "./subtask-dependencies-modal";

const options = [
  { documentId: "a", name: "Soldar" },
  { documentId: "b", name: "Pintar" },
];

describe("SubTaskDependenciesModal", () => {
  it("lists sibling sub-tasks and confirms selected dependencies", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderWithIntl(
      <SubTaskDependenciesModal
        open
        options={options}
        selectedIds={["a"]}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Soldar")).toBeInTheDocument();
    expect(screen.getByText("Pintar")).toBeInTheDocument();
    expect(screen.getByRole("presentation").className).toContain(
      FORM_MODAL_DIALOG_OVERLAY_Z_CLASS,
    );

    await user.click(screen.getByLabelText("Pintar"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onConfirm).toHaveBeenCalledWith(["a", "b"]);
  });
});
