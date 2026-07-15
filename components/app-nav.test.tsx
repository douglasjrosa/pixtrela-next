import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

const signOut = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { role: "admin", name: "Admin" },
    },
  }),
  signOut: (...args: unknown[]) => signOut(...args),
}));

import { AppNav } from "./app-nav";

describe("AppNav", () => {
  beforeEach(() => {
    signOut.mockReset();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders fixed header with brand and desktop links on large screens", () => {
    renderWithIntl(<AppNav />);

    const header = screen.getByRole("banner");
    expect(header.className).toContain("fixed");
    expect(screen.getByRole("link", { name: "Pixtrela" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurações" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir menu" }),
    ).not.toBeInTheDocument();
  });

  it("shows mobile menu button on small screens", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    renderWithIntl(<AppNav />);

    expect(
      screen.getByRole("button", { name: "Abrir menu" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Painel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
  });

  it("opens the mobile menu from the menu button", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    renderWithIntl(<AppNav />);

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
  });
});
