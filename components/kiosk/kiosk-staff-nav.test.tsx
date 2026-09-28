import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/kiosk/staff/mgr-1",
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

function renderNav() {
  return renderWithIntl(
    <KioskStaffNav homeHref="/kiosk/staff/mgr-1/queues" />,
  );
}

describe("KioskStaffNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render a sandwich menu", () => {
    renderNav();

    expect(
      screen.queryByRole("button", { name: "Abrir menu" }),
    ).not.toBeInTheDocument();
  });

  it("shows brand link and device sign-out only", () => {
    renderNav();

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Abrir menu da conta/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("switch", { name: "Modo Totem" }),
    ).not.toBeInTheDocument();
  });
});
