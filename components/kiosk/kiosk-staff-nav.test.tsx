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
  { href: "/kiosk/staff/lead-1", label: "Painel" },
  { href: "/kiosk/staff/lead-1/board", label: "Quadro" },
  { href: "/kiosk/staff/lead-1/tasks", label: "Tarefas" },
  { href: "/kiosk/staff/lead-1/queues", label: "Equipes" },
];

function renderNav(canSignOutDevice = false) {
  return renderWithIntl(
    <KioskStaffNav
      userName="Líder Teste"
      homeHref="/kiosk/staff/lead-1"
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

    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute(
      "href",
      "/kiosk/staff/lead-1",
    );
    expect(screen.getByRole("link", { name: "Quadro" })).toHaveAttribute(
      "href",
      "/kiosk/staff/lead-1/board",
    );
    expect(screen.getByRole("link", { name: "Tarefas" })).toHaveAttribute(
      "href",
      "/kiosk/staff/lead-1/tasks",
    );
    expect(screen.getByRole("link", { name: "Equipes" })).toHaveAttribute(
      "href",
      "/kiosk/staff/lead-1/queues",
    );
  });

  it("shows the staff user menu trigger", () => {
    renderNav();

    expect(
      screen.getByRole("button", { name: /Líder Teste/i }),
    ).toBeInTheDocument();
  });
});
