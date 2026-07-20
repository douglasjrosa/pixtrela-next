import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskIdleScreen } from "./kiosk-idle-screen";

describe("KioskIdleScreen", () => {
  it("shows idle message translation", () => {
    renderWithIntl(<KioskIdleScreen />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /equipe|cartão|código/i,
    );
  });
});
