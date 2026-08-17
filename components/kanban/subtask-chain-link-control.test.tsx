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
    expect(document.querySelector('[data-slot="chain-line"]')).toBeNull();
  });

  it("draws one C-frame behind the button when linked", () => {
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
    expect(button).toHaveClass("z-10");

    expect(screen.getByTestId("subtask-chain-link")).toHaveClass("z-0");

    const frame = document.querySelector('[data-slot="chain-line"]');
    expect(frame).toHaveClass("absolute");
    expect(frame).toHaveClass("left-1/2");
    expect(frame).toHaveClass("-translate-y-1/2");
    expect(frame).toHaveClass("border-2");
    expect(frame).toHaveClass("border-dashed");
    expect(frame).toHaveClass("border-l");
    expect(frame).toHaveClass("border-t");
    expect(frame).toHaveClass("border-b");
    expect(frame).toHaveClass("border-r-0");
    expect(frame).toHaveClass("h-[calc(var(--subtask-chain-gap)+5rem)]");
    expect(frame?.className).not.toMatch(/\bz-\[-1\]\b/);
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
    expect(document.querySelector('[data-slot="chain-line"]')).toBeNull();
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
