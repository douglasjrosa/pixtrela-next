import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/test-utils";

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

    await user.click(screen.getByRole("switch", { name: "Modo Totem" }));
    expect(setPersonalTotemMode).toHaveBeenCalledWith(true);
  });
});
