import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { KioskActionButton } from "./kiosk-action-button";

describe("KioskActionButton", () => {
  it("renders a full-width min-height touch target", () => {
    renderWithIntl(<KioskActionButton>Iniciar</KioskActionButton>);
    const button = screen.getByRole("button", { name: "Iniciar" });
    expect(button).toHaveClass("min-h-14");
    expect(button).toHaveClass("w-full");
    expect(button).toHaveClass("text-lg");
  });
});
