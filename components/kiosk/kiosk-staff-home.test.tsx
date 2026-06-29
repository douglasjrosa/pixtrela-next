import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskStaffHome } from "./kiosk-staff-home";

describe("KioskStaffHome", () => {
  it("shows users link and sign out for admin and manager", () => {
    renderWithIntl(<KioskStaffHome userId="admin-1" canSignOut />);

    expect(screen.getByRole("heading", { name: "Totem — gestão" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute(
      "href",
      "/kiosk/staff/admin-1/users",
    );
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("hides sign out for leader", () => {
    renderWithIntl(<KioskStaffHome userId="lead-1" canSignOut={false} />);

    expect(screen.getByRole("link", { name: "Usuários" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
  });
});
