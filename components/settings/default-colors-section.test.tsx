import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { renderWithIntl } from "@/test/test-utils";
import { DEFAULT_SEMANTIC_TOKENS } from "@/lib/themes/semantic-tokens";
import { getSemanticThemePreset } from "@/lib/themes/semantic-theme-presets";
import { SEMANTIC_THEME_STYLE_ID } from "@/lib/themes/apply-semantic-theme-document";

import { DefaultColorsSection } from "./default-colors-section";

describe("DefaultColorsSection", () => {
  beforeEach(() => {
    const style = document.createElement("style");
    style.id = SEMANTIC_THEME_STYLE_ID;
    document.head.appendChild(style);
  });

  afterEach(() => {
    document.getElementById(SEMANTIC_THEME_STYLE_ID)?.remove();
  });

  it("applies a preset to color pickers without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Oceano" }));

    expect(screen.getByRole("button", { name: "Oceano" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Padrão" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      (document.getElementById("semantic-token-primary") as HTMLInputElement)
        ?.value,
    ).toBe("#1e6fbf");
    const style = document.getElementById(SEMANTIC_THEME_STYLE_ID);
    expect(style?.textContent).toContain("--primary: #1e6fbf;");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("applies the midnight preset tokens without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Noturno" }));

    expect(
      (document.getElementById("semantic-token-background") as HTMLInputElement)
        ?.value,
    ).toBe("#0f172a");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with draft tokens when save is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Violeta" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ primary: "#6d28d9" }),
    );
    expect(screen.getByRole("button", { name: "Violeta" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const style = document.getElementById(SEMANTIC_THEME_STYLE_ID);
    expect(style?.textContent).toContain("--primary: #6d28d9;");
    expect(refresh).toHaveBeenCalled();
  });

  it("highlights the preset that matches initial tokens on load", () => {
    const oceanTokens = getSemanticThemePreset("ocean").tokens;

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={oceanTokens}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole("button", { name: "Oceano" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Padrão" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("clears preset highlight when tokens are edited manually", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Oceano" }));
    const primaryInput = screen.getByRole("textbox", { name: "Primária" });
    await user.clear(primaryInput);
    await user.type(primaryInput, "#123456");

    expect(screen.getByRole("button", { name: "Oceano" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("restores the saved palette preview when leaving the page", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    const view = renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Néon" }));
    const style = document.getElementById(SEMANTIC_THEME_STYLE_ID);
    expect(style?.textContent).toContain("--primary: #d946ef;");

    view.unmount();

    expect(style?.textContent).toContain(
      `--primary: ${DEFAULT_SEMANTIC_TOKENS.primary};`,
    );
  });

  it("renders token groups as accordions with expand and collapse all", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const surfacesToggle = screen.getByRole("button", { name: "Superfícies" });
    expect(surfacesToggle).toHaveAttribute("aria-expanded", "true");

    await user.click(surfacesToggle);
    expect(surfacesToggle).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Mostrar tudo" }));
    expect(surfacesToggle).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Esconder tudo" }));
    expect(surfacesToggle).toHaveAttribute("aria-expanded", "false");
  });

  it("places save above the accordion and restore below it", () => {
    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    const restoreButton = screen.getByRole("button", {
      name: "Restaurar padrão original",
    });
    const surfacesToggle = screen.getByRole("button", { name: "Superfícies" });

    expect(
      saveButton.compareDocumentPosition(surfacesToggle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      surfacesToggle.compareDocumentPosition(restoreButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
