import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskSubtaskEarnedCredits } from "./kiosk-subtask-earned-credits";

describe("KioskSubtaskEarnedCredits", () => {
  it("renders a star and the earned amount aligned as a row", () => {
    renderWithIntl(<KioskSubtaskEarnedCredits amount={12} />);

    const row = screen.getByTestId("kiosk-earned-credits");
    expect(row).toHaveClass("flex", "justify-end");
    expect(row).toHaveAttribute("aria-label", "12 créditos ganhos");
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
