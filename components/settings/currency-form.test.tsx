import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { CurrencyForm } from "./currency-form";

describe("CurrencyForm", () => {
  it("renders currencyPerSecond field", () => {
    renderWithIntl(<CurrencyForm currencyPerSecond={2} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Estrelas por segundo")).toHaveValue(2);
  });

  it("calls onSave with updated value", async () => {
    const onSave = vi.fn();
    renderWithIntl(<CurrencyForm currencyPerSecond={2} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Estrelas por segundo"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ currencyPerSecond: 3 });
    });
  });
});
