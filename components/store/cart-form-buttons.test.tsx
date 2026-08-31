import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { CartQtyButton } from "./cart-form-buttons";

describe("cart form buttons", () => {
  it("renders qty button with icon and calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithIntl(<CartQtyButton action="increase" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders decrease button with accessible label", () => {
    renderWithIntl(<CartQtyButton action="decrease" onClick={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Diminuir valor" }),
    ).toBeInTheDocument();
  });
});
