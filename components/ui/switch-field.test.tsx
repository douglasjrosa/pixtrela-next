import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { SwitchField } from "./switch-field";

describe("SwitchField", () => {
  it("renders label and toggles checked state", () => {
    const onCheckedChange = vi.fn();
    renderWithIntl(
      <SwitchField
        id="demo-switch"
        label="Mostrar na loja"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Mostrar na loja" });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalled();
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true);
  });
});
