import { describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { LoginEntryClient } from "./login-entry-client";

const push = vi.fn();
const refresh = vi.fn();
const signIn = vi.fn();
const getSession = vi.fn();
const loginByCode = vi.fn();
const loginByTag = vi.fn();
const loginByFace = vi.fn();
const watchNfcSerialNumbers = vi.fn(() => ({ stop: vi.fn() }));
const isNfcReadSupported = vi.fn(() => false);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
  getSession: (...args: unknown[]) => getSession(...args),
}));

vi.mock("@/app/login/actions", () => ({
  loginByCode: (...args: unknown[]) => loginByCode(...args),
  loginByTag: (...args: unknown[]) => loginByTag(...args),
  loginByFace: (...args: unknown[]) => loginByFace(...args),
  loginByFaceConfirm: vi.fn(),
}));

vi.mock("@/lib/kiosk/nfc-read", () => ({
  isNfcReadSupported: () => isNfcReadSupported(),
  watchNfcSerialNumbers: (...args: unknown[]) =>
    watchNfcSerialNumbers(...args),
}));

vi.mock("@/lib/kiosk/face/load-face-models", () => ({
  loadFaceModels: vi.fn(async () => ({})),
}));

describe("LoginEntryClient", () => {
  beforeEach(() => {
    cleanup();
    push.mockReset();
    refresh.mockReset();
    signIn.mockReset();
    getSession.mockReset();
    loginByCode.mockReset();
    isNfcReadSupported.mockReturnValue(false);
    watchNfcSerialNumbers.mockReturnValue({ stop: vi.fn() });
  });

  it("shows the same entry chooser as kiosk plus username login", () => {
    renderWithIntl(<LoginEntryClient />);
    expect(
      screen.getByRole("button", { name: "Reconhecimento facial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Código e senha" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Entrar com usuário e senha" }),
    ).toBeInTheDocument();
  });

  it("opens classic username form from the chooser", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LoginEntryClient />);
    await user.click(
      screen.getByRole("button", { name: "Entrar com usuário e senha" }),
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Login")).toBeInTheDocument();
      expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    });
  });

  it("establishes a session after code identify", async () => {
    const user = userEvent.setup();
    loginByCode.mockResolvedValue({
      ok: true,
      jwt: "token",
      user: {
        id: 1,
        documentId: "u1",
        username: "maria.1",
        email: null,
        name: "Maria",
        roleType: "colaborator",
      },
    });
    signIn.mockResolvedValue({ error: null });
    getSession.mockResolvedValue({
      user: { id: "u1", role: "colaborator" },
    });

    renderWithIntl(<LoginEntryClient />);
    await user.click(screen.getByRole("button", { name: "Código e senha" }));
    await user.type(screen.getByLabelText("Código"), "1234");
    await user.type(screen.getByLabelText("Senha"), "secret1");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(loginByCode).toHaveBeenCalledWith(1234, "secret1");
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({ jwt: "token", redirect: false }),
      );
      expect(push).toHaveBeenCalledWith("/u1");
    });
  });
});
