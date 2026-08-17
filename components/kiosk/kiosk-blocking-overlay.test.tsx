import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { KioskBlockingOverlay } from "./kiosk-blocking-overlay";

describe("KioskBlockingOverlay", () => {
  it("shows a busy loading status", () => {
    renderWithIntl(<KioskBlockingOverlay />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status").className).toContain("fixed");
    expect(screen.getByText("Processando...")).toBeInTheDocument();
    expect(document.querySelector(".kiosk-blocking-spinner")).not.toBeNull();
  });
});
