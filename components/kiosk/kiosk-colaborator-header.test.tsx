import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskColaboratorHeader } from "./kiosk-colaborator-header";

describe("KioskColaboratorHeader", () => {
  it("renders the colaborator name and avatar image", () => {
    renderWithIntl(
      <KioskColaboratorHeader
        name="Ana Silva"
        avatarUrl="/uploads/ana.jpg"
      />,
    );

    expect(
      screen.getByRole("banner", { name: "Colaborador Ana Silva" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ana Silva" })).toBeInTheDocument();
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "/api/strapi-media?path=%2Fuploads%2Fana.jpg",
    );
  });

  it("renders a fallback icon when avatar is missing", () => {
    renderWithIntl(<KioskColaboratorHeader name="Bruno" avatarUrl={null} />);

    expect(screen.getByRole("heading", { name: "Bruno" })).toBeInTheDocument();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });
});
