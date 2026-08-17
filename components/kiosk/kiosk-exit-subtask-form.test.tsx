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

    expect(screen.getByLabelText("Quantas peças você concluiu?")).toHaveValue(10);

    await user.clear(screen.getByLabelText("Quantas peças você concluiu?"));
    await user.type(screen.getByLabelText("Quantas peças você concluiu?"), "4");
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(onConfirm).toHaveBeenCalledWith({
      sharingType: "qty",
      qtyCompleted: 4,
    });
  });

  it("uses stepper buttons to adjust completed qty", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithIntl(
      <KioskExitSubtaskForm
        sharingType="qty"
        maxQty={5}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Diminuir quantidade" }));
    expect(screen.getByLabelText("Quantas peças você concluiu?")).toHaveValue(4);

    await user.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    expect(screen.getByLabelText("Quantas peças você concluiu?")).toHaveValue(5);
  });

  it("accepts zero completed qty", async () => {
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

    await user.click(screen.getByRole("button", { name: "Diminuir quantidade" }));
    await user.click(screen.getByRole("button", { name: "Diminuir quantidade" }));
    await user.click(screen.getByRole("button", { name: "Diminuir quantidade" }));
    expect(screen.getByLabelText("Quantas peças você concluiu?")).toHaveValue(0);
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(onConfirm).toHaveBeenCalledWith({
      sharingType: "qty",
      qtyCompleted: 0,
    });
  });

  it("clamps typed qty to remaining max", async () => {
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

    const input = screen.getByLabelText("Quantas peças você concluiu?");
    expect(input).toHaveValue(3);
    expect(
      screen.getByRole("button", { name: "Aumentar quantidade" }),
    ).toBeDisabled();

    await user.clear(input);
    await user.type(input, "5");
    expect(input).toHaveValue(3);
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(onConfirm).toHaveBeenCalledWith({
      sharingType: "qty",
      qtyCompleted: 3,
    });
  });

  it("hides completion options when peers are still active", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithIntl(
      <KioskExitSubtaskForm
        sharingType="duration"
        allowComplete={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Sim, concluí" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));
    expect(onConfirm).toHaveBeenCalledWith({
      sharingType: "duration",
      isCompleted: false,
    });
  });
});
