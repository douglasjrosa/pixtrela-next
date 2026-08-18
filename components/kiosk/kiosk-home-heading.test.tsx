import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import {
  KIOSK_HOME_HEADING_TOP_CLASS,
  KioskHomeHeading,
} from "./kiosk-home-heading";

describe("KioskHomeHeading", () => {
  it("renders the title with extra top spacing", () => {
    renderWithIntl(<KioskHomeHeading title="Totem" />);

    expect(screen.getByRole("heading", { name: "Totem" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass(
      ...KIOSK_HOME_HEADING_TOP_CLASS.split(" "),
    );
  });

  it("renders the totem name centered below the title", () => {
    renderWithIntl(
      <KioskHomeHeading title="Totem" totemName="  Linha Montagem  " />,
    );

    const title = screen.getByRole("heading", { name: "Totem" });
    const name = screen.getByText("Linha Montagem");
    const following = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(name).toHaveClass("text-center");
    expect(title.compareDocumentPosition(name) & following).toBe(following);
  });

  it("omits the name when it is blank", () => {
    renderWithIntl(<KioskHomeHeading title="Totem" totemName="   " />);

    expect(screen.getByRole("heading", { name: "Totem" })).toBeInTheDocument();
    expect(screen.queryByText("   ")).not.toBeInTheDocument();
  });
});
