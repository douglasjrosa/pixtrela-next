import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { StoreWindowInfoCard } from "./store-window-info-card";

describe("StoreWindowInfoCard", () => {
  it("merges the open-window messages into one card with two paragraphs", () => {
    const { container } = renderWithIntl(
      <StoreWindowInfoCard windowPhase="open" firstDay={3} lastDay={15} />,
    );

    const card = screen.getByRole("status");
    const paragraphs = card.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent(/janela de trocas aberta/i);
    expect(paragraphs[1]).toHaveTextContent(/fecha automaticamente no dia 15/i);
    expect(container.textContent).not.toMatch(/não é necessário confirmar/i);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the after-close message when the window has ended", () => {
    renderWithIntl(
      <StoreWindowInfoCard windowPhase="after_close" firstDay={3} lastDay={15} />,
    );

    const card = screen.getByRole("alert");
    const paragraphs = card.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent(/disponíveis somente/i);
    expect(paragraphs[1]).toHaveTextContent(/janela de trocas encerrou/i);
  });

  it("shows the before-open message at the start of the month", () => {
    renderWithIntl(
      <StoreWindowInfoCard windowPhase="before_open" firstDay={3} lastDay={30} />,
    );

    const card = screen.getByRole("alert");
    const paragraphs = card.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent(/disponíveis somente/i);
    expect(paragraphs[1]).toHaveTextContent(
      /janela de trocas ainda não está aberta/i,
    );
  });
});
