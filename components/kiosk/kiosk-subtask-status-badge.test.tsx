import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { KioskSubtaskStatusBadge } from "./kiosk-subtask-status-badge";

describe("KioskSubtaskStatusBadge", () => {
  it("renders producing status as an uppercase green badge", () => {
    renderWithIntl(<KioskSubtaskStatusBadge status="producing" />);

    const badge = screen.getByText("Produzindo");
    expect(badge).toHaveClass("uppercase");
    expect(badge).toHaveClass("bg-[#25D366]");
  });
});
