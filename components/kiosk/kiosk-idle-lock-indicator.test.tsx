import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskIdleLockIndicator } from "./kiosk-idle-lock-indicator";
import { KioskIdleProvider } from "./kiosk-idle-provider";

const { replace, refresh, pathname } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  pathname: { current: "/kiosk/staff/admin-1" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => pathname.current,
}));

describe("KioskIdleLockIndicator", () => {
  it("shows open lock with session label on active routes", () => {
    pathname.current = "/kiosk/staff/admin-1";
    renderWithIntl(
      <KioskIdleProvider>
        <KioskIdleLockIndicator />
      </KioskIdleProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Encerrar sessão do totem" }),
    ).toBeInTheDocument();
  });

  it("locks and redirects when the open lock button is clicked", async () => {
    const user = userEvent.setup();
    pathname.current = "/kiosk/staff/admin-1";
    replace.mockClear();

    renderWithIntl(
      <KioskIdleProvider>
        <KioskIdleLockIndicator />
      </KioskIdleProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Encerrar sessão do totem" }),
    );

    expect(replace).toHaveBeenCalledWith("/kiosk");
  });

  it("shows closed home lock on kiosk home", () => {
    pathname.current = "/kiosk";
    renderWithIntl(
      <KioskIdleProvider>
        <KioskIdleLockIndicator />
      </KioskIdleProvider>,
    );

    expect(
      screen.getByRole("img", { name: "Totem aguardando identificação" }),
    ).toBeInTheDocument();
  });
});
