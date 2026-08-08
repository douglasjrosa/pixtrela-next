import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { KioskActionButton } from "./kiosk-action-button";

describe("KioskActionButton", () => {
  it("renders a full-width min-height touch target", () => {
    renderWithIntl(<KioskActionButton>Iniciar</KioskActionButton>);
    const button = screen.getByRole("button", { name: "Iniciar" });
    expect(button).toHaveClass("min-h-14");
    expect(button).toHaveClass("w-full");
    expect(button).toHaveClass("text-lg");
  });

  it("uses primary fill by default", () => {
    renderWithIntl(<KioskActionButton>Entrar</KioskActionButton>);
    const button = screen.getByRole("button", { name: "Entrar" });
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
  });

  it("keeps produce and outline variants distinct from primary", () => {
    renderWithIntl(
      <KioskActionButton actionVariant="produce">Produzir</KioskActionButton>,
    );
    expect(screen.getByRole("button", { name: "Produzir" })).toHaveClass(
      "bg-[var(--success)]",
    );

    renderWithIntl(
      <KioskActionButton actionVariant="outline">Cancelar</KioskActionButton>,
    );
    const outline = screen.getByRole("button", { name: "Cancelar" });
    expect(outline.className).toMatch(/border/);
    expect(outline).not.toHaveClass("bg-primary");
  });
});
