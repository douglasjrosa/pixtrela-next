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

    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Colaborador Ana Silva" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("presentation").getAttribute("src")).toContain(
      encodeURIComponent("/api/media/ana.jpg"),
    );
  });

  it("renders a fallback icon when avatar is missing", () => {
    renderWithIntl(
      <KioskColaboratorHeader name="Bruno" avatarUrl={null} />,
    );

    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  it("renders a single edit button with pencil icon when showEdit is true", () => {
    renderWithIntl(
      <KioskColaboratorHeader
        name="Ana"
        showEdit
        onEditClick={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("hides the edit button by default", () => {
    renderWithIntl(<KioskColaboratorHeader name="Ana" />);

    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
  });
});
