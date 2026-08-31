import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

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
    contentMarginMobile: "md",
    contentMarginDesktop: "lg",
    foregroundColor: "#002555",
    surfaceColor: "#ffffff",
    surfaceColorOpacity: 100,
  },
];

describe("ThemeSettingsManager", () => {
  const defaultProps = {
    themes,
    onSave: vi.fn(),
    onUploadImage: vi.fn(),
  };

  it("renders route themes without the default colors section", () => {
    renderWithIntl(<ThemeSettingsManager {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Temas por rota" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Oceano")).not.toBeInTheDocument();
    expect(screen.getByText(/Selecione uma rota para configurar/i)).toBeInTheDocument();
  });

  it("renders route theme cards without the edit form by default", () => {
    renderWithIntl(<ThemeSettingsManager {...defaultProps} />);

    const list = screen.getByRole("list", { name: "Temas por rota" });
    expect(list).toHaveClass("md:grid-cols-3", "lg:grid-cols-4", "xl:grid-cols-5");
    expect(screen.getAllByText("Login").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Totem").length).toBeGreaterThan(0);
    expect(screen.getByText("login")).toBeInTheDocument();
    expect(screen.getByText("kiosk")).toBeInTheDocument();
    expect(screen.getAllByText("Cor de fundo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Imagem").length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Cor de fundo")).not.toBeInTheDocument();
  });

  it("opens the theme modal when a row is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ThemeSettingsManager {...defaultProps} />);

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
    expect(within(dialog).getByLabelText("Cor do container")).toBeInTheDocument();
  });

  it("closes the modal after a successful save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <ThemeSettingsManager {...defaultProps} onSave={onSave} />,
    );

    await user.click(screen.getAllByRole("button", { name: /Editar tema de Login/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("persists margin selections in the save payload", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <ThemeSettingsManager {...defaultProps} onSave={onSave} />,
    );

    await user.click(screen.getAllByRole("button", { name: /Editar tema de Login/i })[0]);
    await user.selectOptions(
      screen.getByLabelText("Margem da página (mobile)"),
      "xl",
    );
    await user.selectOptions(
      screen.getByLabelText("Margem da página (desktop)"),
      "sm",
    );
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith(
      "doc-login",
      expect.objectContaining({
        contentMarginMobile: "xl",
        contentMarginDesktop: "sm",
      }),
    );
  });
});
