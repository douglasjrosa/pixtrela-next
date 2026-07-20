import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskMemberPicker } from "./kiosk-member-picker";

describe("KioskMemberPicker", () => {
  it("selects a member with face photo", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithIntl(
      <KioskMemberPicker
        members={[
          {
            documentId: "c1",
            name: "Ana",
            facePhotoUrl: "http://localhost:1337/uploads/a.jpg",
          },
        ]}
        onSelect={onSelect}
        onBack={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Ana/i }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("disables members without face photo", () => {
    renderWithIntl(
      <KioskMemberPicker
        members={[{ documentId: "c1", name: "Ana", facePhotoUrl: null }]}
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Ana/i })).toBeDisabled();
  });
});
