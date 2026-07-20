import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskTeamPicker } from "./kiosk-team-picker";

describe("KioskTeamPicker", () => {
  it("calls onSelect when a team is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithIntl(
      <KioskTeamPicker
        teams={[
          { documentId: "t1", name: "Alpha" },
          { documentId: "t2", name: "Beta" },
        ]}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Alpha" }));
    expect(onSelect).toHaveBeenCalledWith({ documentId: "t1", name: "Alpha" });
  });

  it("shows empty state", () => {
    renderWithIntl(<KioskTeamPicker teams={[]} onSelect={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nenhum time disponível.",
    );
  });
});
