import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { CurrencyForm } from "./currency-form";

const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

describe("CurrencyForm", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
  });

  it("renders currencyPerSecond field", () => {
    renderWithIntl(<CurrencyForm currencyPerSecond={2} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Estrelas por segundo")).toHaveValue(2);
  });

  it("calls onSave with updated value and shows success toast", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(<CurrencyForm currencyPerSecond={2} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Estrelas por segundo"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ currencyPerSecond: 3 });
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Configurações salvas.");
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("shows error toast when onSave fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("forbidden"));
    renderWithIntl(<CurrencyForm currencyPerSecond={2} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith(
        "Não foi possível salvar as configurações.",
      );
    });
    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
