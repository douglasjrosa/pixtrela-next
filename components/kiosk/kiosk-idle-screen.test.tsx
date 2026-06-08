import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskIdleScreen } from "./kiosk-idle-screen";

describe("KioskIdleScreen", () => {
  it("shows idle message translation", () => {
    renderWithIntl(<KioskIdleScreen />);
    expect(
      screen.getByText(
        "Aproxime o seu cartão ou digite seu código e senha.",
      ),
    ).toBeInTheDocument();
  });
});
