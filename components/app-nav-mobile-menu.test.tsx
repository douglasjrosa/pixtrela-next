import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { AppNavMobileMenu } from "./app-nav-mobile-menu";

const items = [
  { href: "/", labelKey: "panel" },
  { href: "/board", labelKey: "board" },
  { href: "/tasks", labelKey: "tasks" },
];

describe("AppNavMobileMenu", () => {
  it("does not render dialog when closed", () => {
    renderWithIntl(
      <AppNavMobileMenu
        open={false}
        items={items}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders navigation links when open", () => {
    renderWithIntl(
      <AppNavMobileMenu open items={items} onOpenChange={vi.fn()} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Quadro" })).toHaveAttribute(
      "href",
      "/board",
    );
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
  });

  it("closes when pressing the close button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithIntl(
      <AppNavMobileMenu open items={items} onOpenChange={onOpenChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when clicking a navigation link", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithIntl(
      <AppNavMobileMenu open items={items} onOpenChange={onOpenChange} />,
    );

    await user.click(screen.getByRole("link", { name: "Tarefas" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithIntl(
      <AppNavMobileMenu open items={items} onOpenChange={onOpenChange} />,
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
