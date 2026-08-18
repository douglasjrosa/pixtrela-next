import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

const signOut = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        role: "admin",
        name: "Admin",
        id: "admin-1",
        avatarUrl: null,
      },
    },
  }),
  signOut: (...args: unknown[]) => signOut(...args),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) => <img src={src} alt={alt} {...props} />,
}));

import { AppNav } from "./app-nav";
import { APP_LOGO_MARK } from "@/lib/assets/branding";

function findBrandLink() {
  return screen.getAllByRole("link").find((link) =>
    link.querySelector(`img[src="${APP_LOGO_MARK}"]`),
  );
}

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

  it("renders fixed header with brand, desktop links, and user menu", () => {
    renderWithIntl(<AppNav />);

    const header = screen.getByRole("banner");
    expect(header.className).toContain("fixed");
    expect(findBrandLink()).toBeDefined();
    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurações" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Admin, Abrir menu da conta" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir menu" }),
    ).not.toBeInTheDocument();
  });

  it("shows mobile menu button before the brand on small screens", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    renderWithIntl(<AppNav />);

    const menuButton = screen.getByRole("button", { name: "Abrir menu" });
    const brandLink = findBrandLink();
    expect(brandLink).toBeDefined();
    expect(menuButton.compareDocumentPosition(brandLink!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.queryByRole("link", { name: "Painel" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Admin, Abrir menu da conta" }),
    ).toBeInTheDocument();
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
