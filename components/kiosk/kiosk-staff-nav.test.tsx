import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/kiosk/staff/lead-1",
}));

vi.mock("./kiosk-idle-provider", () => ({
  useKioskIdleContext: () => ({
    lockSession: vi.fn(),
    progress: 0,
    phase: "active",
    reset: vi.fn(),
  }),
}));

import { renderWithIntl } from "@/test/test-utils";
import { KioskStaffNav } from "./kiosk-staff-nav";

const leaderItems = [
  { href: "/kiosk/staff/lead-1/queues", label: "Filas" },
  { href: "/kiosk/staff/lead-1/team-access", label: "Acesso da equipe" },
];

function renderNav(canSignOutDevice = false) {
  return renderWithIntl(
    <KioskStaffNav
      userName="Líder Teste"
      homeHref="/kiosk/staff/lead-1/queues"
      items={leaderItems}
      canSignOutDevice={canSignOutDevice}
    />,
  );
}

describe("KioskStaffNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders consolidated staff links in the drawer", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));

    expect(screen.getByRole("link", { name: "Filas" })).toHaveAttribute(
      "href",
      "/kiosk/staff/lead-1/queues",
    );
    expect(
      screen.getByRole("link", { name: "Acesso da equipe" }),
    ).toHaveAttribute("href", "/kiosk/staff/lead-1/team-access");
  });

  it("shows the staff user menu trigger", () => {
    renderNav();

    expect(
      screen.getByRole("button", { name: /Líder Teste/i }),
    ).toBeInTheDocument();
  });
});
