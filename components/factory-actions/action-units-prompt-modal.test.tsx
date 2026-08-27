import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { sampleSubTaskPreset } from "@/test/sample-subtask-preset";
import { ActionUnitsPromptModal } from "./action-units-prompt-modal";

describe("ActionUnitsPromptModal", () => {
  it("confirms rounded unit_time * actionUnits", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const preset = sampleSubTaskPreset({
      actionUnitTime: 1.04,
      actionQtyQuestion: "Quantos grampos serão fixados no total?",
    });

    renderWithIntl(
      <ActionUnitsPromptModal
        open
        preset={preset}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const input = screen.getByLabelText(
      "Quantos grampos serão fixados no total?",
    );
    await user.clear(input);
    await user.type(input, "30");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onConfirm).toHaveBeenCalledWith(31);
  });
});
