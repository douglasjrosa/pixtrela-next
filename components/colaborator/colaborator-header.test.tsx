import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColaboratorHeader } from "@/components/colaborator/colaborator-header";
import { renderWithIntl } from "@/test/test-utils";

const signOut = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/colab-1",
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
    expect(
      screen.getByRole("button", { name: "Maria, Abrir menu da conta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Maria" })).toHaveAttribute(
      "src",
      "https://media.example/avatar.jpg",
    );
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
  });
});
