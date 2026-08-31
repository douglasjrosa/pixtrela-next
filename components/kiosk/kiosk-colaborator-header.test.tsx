import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskColaboratorHeader } from "./kiosk-colaborator-header";

describe("KioskColaboratorHeader", () => {
  it("renders the colaborator name and avatar image", () => {
    renderWithIntl(
      <KioskColaboratorHeader
        name="Ana Silva"
        avatarUrl="/api/media/ana.jpg"
      />,
    );

    expect(
      screen.getByRole("banner", { name: "Colaborador Ana Silva" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ana Silva" })).toBeInTheDocument();
    expect(screen.getByRole("presentation").getAttribute("src")).toContain(
      encodeURIComponent("/api/media/ana.jpg"),
    );
  });

  it("renders a fallback icon when avatar is missing", () => {
    renderWithIntl(
      <KioskColaboratorHeader
        name="Bruno"
        avatarUrl={null}
        className="sticky top-0"
      />,
    );

    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass("sticky");
  });
});
