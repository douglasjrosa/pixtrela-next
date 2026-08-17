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

  it("shows a dashed connector when linked", () => {
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
    expect(screen.getByTestId("subtask-chain-link")).toHaveAttribute(
      "data-linked",
      "true",
    );
    const line = document.querySelector('[data-slot="chain-line"]');
    expect(line).toBeTruthy();
    expect(line).toHaveClass("absolute");
    expect(line).toHaveClass("border-dashed");
    expect(line).toHaveClass("border-l");
    expect(line).toHaveClass("border-t");
    expect(line).toHaveClass("border-b");
    expect(button.className).not.toMatch(/\babsolute\b/);
    expect(button).toHaveClass("relative");
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
