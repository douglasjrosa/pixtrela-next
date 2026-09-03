import { describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
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
    await user.type(screen.getByLabelText("Senha"), "secret1");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith("/col-1");
    });
  });
});
