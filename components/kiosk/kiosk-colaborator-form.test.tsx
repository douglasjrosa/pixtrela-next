import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskColaboratorForm } from "./kiosk-colaborator-form";

describe("KioskColaboratorForm", () => {
  it("renders code and password fields", () => {
    renderWithIntl(<KioskColaboratorForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Código")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Código")).toHaveClass("text-center");
    expect(document.activeElement).toBe(screen.getByLabelText("Código"));
  });

  it("submits code and a 6-digit password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithIntl(<KioskColaboratorForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Código"), "1234");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ code: 1234, password: "123456" });
    });
    expect(
      screen.queryByText("A senha deve ter pelo menos 6 caracteres."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Too small/i)).not.toBeInTheDocument();
  });

  it("shows a translated password length error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithIntl(<KioskColaboratorForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Código"), "1234");
    await user.type(screen.getByLabelText("Senha"), "12345");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(
        screen.getByText("A senha deve ter pelo menos 6 caracteres."),
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText(/Too small/i)).not.toBeInTheDocument();
  });
});
