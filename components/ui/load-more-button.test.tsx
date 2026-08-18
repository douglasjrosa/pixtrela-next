import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { LoadMoreButton, LoadMoreButtonRow } from "./load-more-button";

describe("LoadMoreButton", () => {
  it("renders with primary inverted styling", () => {
    renderWithIntl(
      <LoadMoreButtonRow>
        <LoadMoreButton
          label="Carregar mais"
          loadingLabel="Carregando..."
          onClick={vi.fn()}
        />
      </LoadMoreButtonRow>,
    );

    const button = screen.getByRole("button", { name: "Carregar mais" });
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-primary-foreground");
    expect(button.parentElement).toHaveClass("justify-center");
  });

  it("shows loading label and disables while loading", () => {
    renderWithIntl(
      <LoadMoreButton
        label="Carregar mais"
        loadingLabel="Carregando..."
        loading
        onClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Carregando..." }),
    ).toBeDisabled();
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithIntl(
      <LoadMoreButton
        label="Carregar mais"
        loadingLabel="Carregando..."
        onClick={onClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
