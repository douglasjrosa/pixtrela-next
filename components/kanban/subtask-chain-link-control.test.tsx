import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { SubtaskChainLinkControl } from "./subtask-chain-link-control";

describe("SubtaskChainLinkControl", () => {
  it("hides the connector when unlinked", () => {
    renderWithIntl(
      <SubtaskChainLinkControl
        linked={false}
        linkLabel="Ligar à anterior"
        unlinkLabel="Desligar da anterior"
        onToggle={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Ligar à anterior" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("subtask-chain-link")).toHaveAttribute(
      "data-linked",
      "false",
    );
    expect(document.querySelector('[data-slot="chain-line-upper"]')).toBeNull();
    expect(document.querySelector('[data-slot="chain-line-lower"]')).toBeNull();
  });

  it("aligns both elbows on the same axis with a thicker dash", () => {
    renderWithIntl(
      <SubtaskChainLinkControl
        linked
        linkLabel="Ligar à anterior"
        unlinkLabel="Desligar da anterior"
        onToggle={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Desligar da anterior" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button.className).not.toMatch(/\babsolute\b/);
    expect(button).toHaveClass("relative");

    const upper = document.querySelector('[data-slot="chain-line-upper"]');
    const lower = document.querySelector('[data-slot="chain-line-lower"]');
    expect(upper).toHaveClass("absolute");
    expect(upper).toHaveClass("left-1/2");
    expect(upper).toHaveClass("border-2");
    expect(upper).toHaveClass("border-dashed");
    expect(upper).toHaveClass("border-l");
    expect(upper).toHaveClass("border-t");
    expect(upper).not.toHaveClass("border-b");

    expect(lower).toHaveClass("absolute");
    expect(lower).toHaveClass("left-1/2");
    expect(lower).toHaveClass("border-2");
    expect(lower).toHaveClass("border-dashed");
    expect(lower).toHaveClass("border-l");
    expect(lower).toHaveClass("border-b");
    expect(lower).not.toHaveClass("border-t");
  });

  it("hides the button and connector while dragging", () => {
    renderWithIntl(
      <SubtaskChainLinkControl
        linked
        hidden
        linkLabel="Ligar à anterior"
        unlinkLabel="Desligar da anterior"
        onToggle={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Desligar da anterior" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="chain-line-upper"]')).toBeNull();
    expect(document.querySelector('[data-slot="chain-line-lower"]')).toBeNull();
    expect(screen.getByTestId("subtask-chain-link")).toHaveAttribute(
      "data-hidden",
      "true",
    );
  });

  it("keeps column space without a button on the first row", () => {
    renderWithIntl(
      <SubtaskChainLinkControl
        linked={false}
        showButton={false}
        linkLabel="Ligar à anterior"
        unlinkLabel="Desligar da anterior"
        onToggle={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("subtask-chain-link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ligar à anterior" }),
    ).not.toBeInTheDocument();
  });

  it("toggles linked state on click", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderWithIntl(
      <SubtaskChainLinkControl
        linked={false}
        linkLabel="Ligar à anterior"
        unlinkLabel="Desligar da anterior"
        onToggle={onToggle}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ligar à anterior" }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderWithIntl(
      <SubtaskChainLinkControl
        linked={false}
        disabled
        linkLabel="Ligar à anterior"
        unlinkLabel="Desligar da anterior"
        onToggle={onToggle}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ligar à anterior" }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
