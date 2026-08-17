import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

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
      screen.getByRole("menuitem", { name: "Meu perfil" }),
    ).toHaveAttribute("href", "/u1/profile");
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
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
