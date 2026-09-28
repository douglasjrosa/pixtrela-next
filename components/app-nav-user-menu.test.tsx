import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { APP_MENU_FONT_CLASS } from "@/lib/ui/app-menu-typography";

import { AppNavUserMenu } from "./app-nav-user-menu";

describe("AppNavUserMenu", () => {
  it("opens a slide-down menu with profile and sign out", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    renderWithIntl(
      <AppNavUserMenu
        userName="Ana"
        profileHref="/u1/profile"
        onSignOut={onSignOut}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Ana, Abrir menu da conta" }),
    );

    expect(
      screen.getByRole("menuitem", { name: "Meu Perfil" }),
    ).toHaveAttribute("href", "/u1/profile");
    const heading = screen.getByText("Ana");
    expect(heading).toHaveClass("font-heading");
    expect(heading).toHaveClass(APP_MENU_FONT_CLASS);
    expect(heading).toHaveClass("uppercase");
    expect(heading.parentElement).toHaveClass("text-center");
    expect(screen.getByRole("menuitem", { name: "Meu Perfil" })).toHaveClass(
      APP_MENU_FONT_CLASS,
    );
    expect(screen.getByRole("menuitem", { name: "Sair" })).toHaveClass(
      APP_MENU_FONT_CLASS,
    );
    expect(screen.getByRole("menu")).not.toHaveClass("uppercase");
    expect(screen.getByRole("menu")).toHaveClass("min-w-80");
    expect(screen.getByTestId("account-menu-backdrop")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
  });

  it("places account extras between the name and profile", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <AppNavUserMenu
        userName="Ana"
        profileHref="/u1/profile"
        onSignOut={vi.fn()}
        accountExtras={<span>Modo Totem</span>}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Ana, Abrir menu da conta" }),
    );

    const name = screen.getByText("Ana");
    const extras = screen.getByText("Modo Totem");
    const profile = screen.getByRole("menuitem", { name: "Meu Perfil" });
    expect(name.compareDocumentPosition(extras)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(extras.compareDocumentPosition(profile)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("calls onSignOut from the menu", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    renderWithIntl(
      <AppNavUserMenu userName="Ana" onSignOut={onSignOut} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Ana, Abrir menu da conta" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Sair" }));

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <AppNavUserMenu userName="Ana" onSignOut={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Ana, Abrir menu da conta" }),
    );
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("menuitem", { name: "Sair" }),
    ).not.toBeInTheDocument();
  });
});
