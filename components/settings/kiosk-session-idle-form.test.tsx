import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { createGetTranslationsMock } from "@/test/mock-next-intl-server";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next-intl/server", () => ({
  getTranslations: createGetTranslationsMock(),
}));

import { KioskSessionIdleForm } from "./kiosk-session-idle-form";

describe("KioskSessionIdleForm", () => {
  it("renders sessionIdleSeconds field", async () => {
    renderWithIntl(
      await KioskSessionIdleForm({
        sessionIdleSeconds: 7,
        action: vi.fn(),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Preferências" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Tempo de sessão do Totem (segundos):"),
    ).toHaveValue(7);
    expect(
      screen.getByLabelText(
        "Intervalo máximo para permitir subtarefas simultâneas (s)",
      ),
    ).toHaveValue(300);
  });
});
