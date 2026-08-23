import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { CartQtyButton, CartRemoveButton } from "./cart-form-buttons";

describe("cart form buttons", () => {
  it("renders qty button and calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithIntl(<CartQtyButton label="+" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "+" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders destructive trash icon with accessible label", () => {
    renderWithIntl(<CartRemoveButton onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Remover" });
    expect(button).toHaveClass("text-destructive");
    expect(button.querySelector("svg")).toBeTruthy();
  });
});
