import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/test-utils";
import { APP_MENU_FONT_CLASS } from "@/lib/ui/app-menu-typography";

const setPersonalTotemMode = vi.fn();

vi.mock("@/app/[documentId]/kiosk/actions", () => ({
  setPersonalTotemMode: (...args: unknown[]) => setPersonalTotemMode(...args),
}));

import { TotemModeSwitch } from "./totem-mode-switch";

describe("TotemModeSwitch", () => {
  it("toggles personal totem mode", async () => {
    const user = userEvent.setup();
    setPersonalTotemMode.mockResolvedValue(undefined);

    renderWithIntl(<TotemModeSwitch enabled={false} />);

    const totemSwitch = screen.getByRole("switch", { name: "Modo Totem" });
    expect(totemSwitch).toHaveAttribute("data-size", "lg");
    expect(screen.getByText("Modo Totem")).toHaveClass(APP_MENU_FONT_CLASS);
    expect(totemSwitch.parentElement).toHaveClass("py-8");
    expect(totemSwitch.parentElement).toHaveClass("gap-4");

    await user.click(totemSwitch);
    expect(setPersonalTotemMode).toHaveBeenCalledWith(true);
  });
});
