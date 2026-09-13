import { describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl, typePassword } from "@/test/test-utils";
import { LoginForm } from "./login-form";

const replace = vi.fn();
const signIn = vi.fn();
const getSession = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
  getSession: (...args: unknown[]) => getSession(...args),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    cleanup();
    replace.mockReset();
    signIn.mockReset();
    getSession.mockReset();
  });

  it("navigates to the role home after credentials sign-in", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ error: null });
    getSession.mockResolvedValue({
      user: { id: "col-1", role: "colaborator" },
    });

    renderWithIntl(<LoginForm />);
    expect(screen.getByLabelText("Login")).toHaveClass("text-center");
    expect(document.activeElement).toBe(screen.getByLabelText("Login"));
    await user.type(screen.getByLabelText("Login"), "maria");
    typePassword(screen.getByLabelText("Senha"), "secret1");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          login: "maria",
          password: "secret1",
          redirect: false,
        }),
      );
      expect(replace).toHaveBeenCalledWith("/col-1");
    });
  });

  it("signs in when the password is filled via change (autofill)", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ error: null });
    getSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });

    renderWithIntl(<LoginForm />);
    await user.type(screen.getByLabelText("Login"), "admin");
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "secret1" },
    });
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          login: "admin",
          password: "secret1",
        }),
      );
      expect(replace).toHaveBeenCalledWith("/");
    });
  });

  it("shows a field error when password is empty", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LoginForm />);
    await user.type(screen.getByLabelText("Login"), "admin");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe a senha.",
    );
    expect(signIn).not.toHaveBeenCalled();
  });
});
