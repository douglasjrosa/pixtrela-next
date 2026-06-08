import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskColaboratorForm } from "./kiosk-colaborator-form";

describe("KioskColaboratorForm", () => {
  it("renders code and password fields", () => {
    renderWithIntl(<KioskColaboratorForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Código")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("submits code and password", async () => {
    const onSubmit = vi.fn();
    renderWithIntl(<KioskColaboratorForm onSubmit={onSubmit} />);

    fireEvent.input(screen.getByLabelText("Código"), {
      target: { value: "1234" },
    });
    fireEvent.input(screen.getByLabelText("Senha"), {
      target: { value: "secret1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ code: 1234, password: "secret1" });
    });
  });
});
