import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { NumberInput } from "./number-input";

describe("NumberInput", () => {
  it("renders a centered number field with custom stepper buttons", () => {
    renderWithIntl(<NumberInput aria-label="Quantidade" defaultValue={2} />);

    const input = screen.getByRole("spinbutton", { name: "Quantidade" });
    expect(input).toHaveClass("text-center");
    expect(screen.getByRole("button", { name: "Aumentar valor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diminuir valor" })).toBeInTheDocument();
  });

  it("increments and decrements the value respecting min and max", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <NumberInput
        aria-label="Quantidade"
        defaultValue={2}
        min={1}
        max={3}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(screen.getByRole("spinbutton", { name: "Quantidade" })).toHaveValue(3);
    await user.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(screen.getByRole("spinbutton", { name: "Quantidade" })).toHaveValue(3);
    await user.click(screen.getByRole("button", { name: "Diminuir valor" }));

    const input = screen.getByRole("spinbutton", { name: "Quantidade" });
    expect(input).toHaveValue(2);
    expect(onChange).toHaveBeenCalled();
  });

  it("forwards ref to the native input", () => {
    const ref = vi.fn();
    renderWithIntl(<NumberInput ref={ref} aria-label="Quantidade" />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });
});
