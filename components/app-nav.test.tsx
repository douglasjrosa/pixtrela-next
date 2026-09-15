import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

const signOut = vi.fn();
const LOGO_URL = "https://media.example/logo.png";

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}));

import { AppNavClient } from "./app-nav-client";

const adminItems = [
  { href: "/", label: "Painel" },
  { href: "/board", label: "Quadro" },
  { href: "/tasks", label: "Tarefas" },
  { href: "/queues", label: "Equipes" },
  { href: "/awards", label: "Prêmios" },
  { href: "/settings/files", label: "Configurações" },
];

function renderNav(items = adminItems) {
  return renderWithIntl(
    <AppNavClient
      logoUrl={LOGO_URL}
      homeHref="/"
      profileHref={null}
      userName="Admin"
      items={items}
    />,
  );
}

function findBrandLink() {
  return screen.getAllByRole("link").find((link) =>
    link.querySelector(`img[src="${LOGO_URL}"]`),
  );
}

describe("AppNavClient", () => {
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
    renderNav();

    const header = screen.getByRole("banner");
    expect(header.className).toContain("fixed");
    expect(findBrandLink()).toBeDefined();
    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/settings/files",
    );
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

    renderNav();

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

    renderNav();

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
  });
});
