import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskHomeChooser } from "./kiosk-home-chooser";

describe("KioskHomeChooser", () => {
  it("renders camera and password actions", () => {
    const onCamera = vi.fn();
    const onPassword = vi.fn();
    renderWithIntl(
      <KioskHomeChooser onCamera={onCamera} onPassword={onPassword} />,
    );

    expect(
      screen.getByRole("button", { name: "Reconhecimento facial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Código e senha" }),
    ).toBeInTheDocument();
  });
});
