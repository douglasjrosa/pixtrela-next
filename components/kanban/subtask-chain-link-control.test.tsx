import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { SubtaskChainLinkControl } from "./subtask-chain-link-control";

describe("SubtaskChainLinkControl", () => {
  it("renders an open-link button between cards when unlinked", () => {
    renderWithIntl(
      <div className="relative">
        <SubtaskChainLinkControl
          linked={false}
          linkLabel="Ligar à anterior"
          unlinkLabel="Desligar da anterior"
          onToggle={vi.fn()}
        />
      </div>,
    );

    const button = screen.getByRole("button", { name: "Ligar à anterior" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("subtask-chain-link")).toHaveAttribute(
      "data-linked",
      "false",
    );
    expect(document.querySelector('[data-slot="chain-line-above"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="chain-line-below"]')).toBeTruthy();
  });

  it("renders a closed-link button when linked", () => {
    renderWithIntl(
      <div className="relative">
        <SubtaskChainLinkControl
          linked
          linkLabel="Ligar à anterior"
          unlinkLabel="Desligar da anterior"
          onToggle={vi.fn()}
        />
      </div>,
    );

    const button = screen.getByRole("button", { name: "Desligar da anterior" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("subtask-chain-link")).toHaveAttribute(
      "data-linked",
      "true",
    );
  });

  it("toggles linked state on click", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderWithIntl(
      <div className="relative">
        <SubtaskChainLinkControl
          linked={false}
          linkLabel="Ligar à anterior"
          unlinkLabel="Desligar da anterior"
          onToggle={onToggle}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Ligar à anterior" }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderWithIntl(
      <div className="relative">
        <SubtaskChainLinkControl
          linked={false}
          disabled
          linkLabel="Ligar à anterior"
          unlinkLabel="Desligar da anterior"
          onToggle={onToggle}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Ligar à anterior" }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
