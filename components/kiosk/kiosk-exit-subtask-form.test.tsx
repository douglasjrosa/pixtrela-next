import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskExitSubtaskForm } from "./kiosk-exit-subtask-form";

describe("KioskExitSubtaskForm", () => {
  it("asks completion for duration sharing", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithIntl(
      <KioskExitSubtaskForm
        sharingType="duration"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sim, concluí" }));
    expect(onConfirm).toHaveBeenCalledWith({
      sharingType: "duration",
      isCompleted: true,
    });
  });

  it("asks completed qty for qty sharing", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithIntl(
      <KioskExitSubtaskForm
        sharingType="qty"
        maxQty={10}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.clear(screen.getByLabelText("Quantas peças você concluiu?"));
    await user.type(screen.getByLabelText("Quantas peças você concluiu?"), "4");
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(onConfirm).toHaveBeenCalledWith({
      sharingType: "qty",
      qtyCompleted: 4,
    });
  });

  it("rejects qty above max", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithIntl(
      <KioskExitSubtaskForm
        sharingType="qty"
        maxQty={3}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.clear(screen.getByLabelText("Quantas peças você concluiu?"));
    await user.type(screen.getByLabelText("Quantas peças você concluiu?"), "5");
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByText("A quantidade não pode exceder o restante da subtarefa."),
    ).toBeInTheDocument();
  });
});
