import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { RouteThemeView } from "@/lib/themes/match-route-theme";

import { ThemeSettingsManager } from "./theme-settings-manager";

const themes: RouteThemeView[] = [
  {
    documentId: "doc-login",
    routeKey: "login",
    label: "Login",
    backgroundColor: "#112233",
    backgroundColorOpacity: 100,
    backgroundImageUrl: "https://cdn.example/login.png",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundMotion: "scroll",
    parallaxIntensity: 35,
    parallaxDirection: "normal",
    parallaxBleed: 20,
    contentMarginMobile: "md",
    contentMarginDesktop: "lg",
    foregroundColor: "#002555",
    surfaceColor: "#ffffff",
    surfaceColorOpacity: 100,
  },
  {
    documentId: "doc-kiosk",
    routeKey: "kiosk",
    label: "Totem",
    backgroundColor: null,
    backgroundColorOpacity: 0,
    backgroundImageUrl: null,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundMotion: "scroll",
    parallaxIntensity: 35,
    parallaxDirection: "normal",
    parallaxBleed: 20,
    contentMarginMobile: "md",
    contentMarginDesktop: "lg",
    foregroundColor: "#002555",
    surfaceColor: "#ffffff",
    surfaceColorOpacity: 100,
  },
];

describe("ThemeSettingsManager", () => {
  it("renders a route list without the edit form by default", () => {
    renderWithIntl(
      <ThemeSettingsManager
        themes={themes}
        onSave={vi.fn()}
        onUploadImage={vi.fn()}
      />,
    );

    expect(screen.getByText("Nome da rota")).toBeInTheDocument();
    expect(screen.getByText("Cor de fundo")).toBeInTheDocument();
    expect(screen.getByText("Imagem")).toBeInTheDocument();
    expect(screen.getAllByText("Login").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Totem").length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Cor de fundo")).not.toBeInTheDocument();
  });

  it("opens the theme modal when a row is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ThemeSettingsManager
        themes={themes}
        onSave={vi.fn()}
        onUploadImage={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /Editar tema de Login/i })[0]);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Login")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Cor de fundo")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Imagem de fundo")).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText("Margem da página (mobile)"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByLabelText("Margem da página (desktop)"),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Cor do texto")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Cor do container")).toBeInTheDocument();
  });

  it("closes the modal after a successful save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <ThemeSettingsManager
        themes={themes}
        onSave={onSave}
        onUploadImage={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /Editar tema de Login/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
