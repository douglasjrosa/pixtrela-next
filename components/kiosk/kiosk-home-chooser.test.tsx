import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskHomeChooser } from "./kiosk-home-chooser";

describe("KioskHomeChooser", () => {
  it("renders camera, password, login and NFC footer", () => {
    const onCamera = vi.fn();
    const onPassword = vi.fn();
    const onUsernameLogin = vi.fn();
    renderWithIntl(
      <KioskHomeChooser
        onCamera={onCamera}
        onPassword={onPassword}
        onUsernameLogin={onUsernameLogin}
        messagesNamespace="auth"
      />,
    );

    expect(
      screen.getByText("Escolha como entrar."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reconhecimento facial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Código e senha" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Login e senha" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ou apenas aproxime sua Tag NFC."),
    ).toBeInTheDocument();
  });
});
