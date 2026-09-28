import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ColaboratorHeader } from "@/components/colaborator/colaborator-header";
import { renderWithIntl } from "@/test/test-utils";

const signOut = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/colab-1",
}));

vi.mock("@/app/[documentId]/kiosk/actions", () => ({
  setPersonalTotemMode: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "colab-1",
        role: "colaborator",
        name: "Maria",
        avatarUrl: "https://media.example/avatar.jpg",
      },
    },
  }),
  signOut: (...args: unknown[]) => signOut(...args),
}));

describe("ColaboratorHeader", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });
  });

  it("renders dashboard and store links plus the account menu", () => {
    renderWithIntl(<ColaboratorHeader homeHref="/colab-1" />);

    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute(
      "href",
      "/colab-1",
    );
    expect(screen.getByRole("link", { name: "Loja" })).toHaveAttribute(
      "href",
      "/colab-1/store",
    );
    expect(screen.getByRole("link", { name: "Trocas" })).toHaveAttribute(
      "href",
      "/colab-1/orders",
    );
    expect(
      screen.getByRole("button", { name: "Maria, Abrir menu da conta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Maria" })).toHaveAttribute(
      "src",
      "https://media.example/avatar.jpg",
    );
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir menu" }),
    ).not.toBeInTheDocument();
    const header = screen.getByRole("banner");
    expect(header.className).toContain("fixed");
    expect(header.className).toContain("top-0");
  });

  it("shows fixed links or the sandwich, never both", async () => {
    const user = userEvent.setup();

    const { unmount } = renderWithIntl(
      <ColaboratorHeader homeHref="/colab-1" showTotemSwitch />,
    );

    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir menu" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Maria, Abrir menu da conta" }),
    );
    expect(screen.getByRole("switch", { name: "Modo Totem" })).toBeInTheDocument();

    unmount();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });
    renderWithIntl(
      <ColaboratorHeader homeHref="/colab-1" showTotemSwitch />,
    );

    expect(screen.queryByRole("link", { name: "Painel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu" })).toBeInTheDocument();
  });

  it("hides header links and the sandwich while personal totem mode is on", () => {
    renderWithIntl(
      <ColaboratorHeader homeHref="/colab-1/kiosk" totemMode showTotemSwitch />,
    );

    expect(screen.queryByRole("link", { name: "Painel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Loja" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir menu" }),
    ).not.toBeInTheDocument();
  });
});
