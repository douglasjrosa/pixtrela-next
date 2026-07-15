import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskSessionIdleForm } from "./kiosk-session-idle-form";

const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

describe("KioskSessionIdleForm", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
  });

  it("renders sessionIdleSeconds field", () => {
    renderWithIntl(
      <KioskSessionIdleForm sessionIdleSeconds={7} onSave={vi.fn()} />,
    );
    expect(screen.getByLabelText("Tempo de sessão do Totem (segundos):")).toHaveValue(
      7,
    );
  });

  it("calls onSave with updated value and shows success toast", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <KioskSessionIdleForm sessionIdleSeconds={7} onSave={onSave} />,
    );

    fireEvent.change(
      screen.getByLabelText("Tempo de sessão do Totem (segundos):"),
      { target: { value: "15" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ sessionIdleSeconds: 15 });
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Configurações salvas.");
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("shows error toast when onSave fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("forbidden"));
    renderWithIntl(
      <KioskSessionIdleForm sessionIdleSeconds={7} onSave={onSave} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith(
        "Não foi possível salvar as configurações.",
      );
    });
    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
