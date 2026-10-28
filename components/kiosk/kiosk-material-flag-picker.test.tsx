import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { MaterialFlagsSettingsProvider } from "@/components/material-flags/material-flags-settings-provider";
import { renderWithIntl } from "@/test/test-utils";

import { KioskMaterialFlagPicker } from "./kiosk-material-flag-picker";

describe("KioskMaterialFlagPicker", () => {
  it("renders flag badges in ascending alphabetical order", () => {
    renderWithIntl(
      <KioskMaterialFlagPicker
        flags={[
          { id: "c", code: "MAD-2" },
          { id: "a", code: "ALM-10" },
          { id: "b", code: "ALM-2" },
        ]}
        selectedIds={[]}
        categoryId="cat-1"
        requiresMaterialFlagsOnFinish
        onChange={vi.fn()}
      />,
    );

    const codes = screen
      .getAllByRole("button")
      .map((button) => button.textContent?.replace(/\s+/g, "") ?? "")
      .filter((label) => /-\d+$/.test(label));

    expect(codes).toEqual(["ALM-2", "ALM-10", "MAD-2"]);
  });

  it("does not render when material flags are disabled", () => {
    renderWithIntl(
      <MaterialFlagsSettingsProvider enabled={false}>
        <KioskMaterialFlagPicker
          flags={[{ id: "a", code: "ALM-1" }]}
          selectedIds={[]}
          categoryId="cat-1"
          requiresMaterialFlagsOnFinish
          onChange={vi.fn()}
        />
      </MaterialFlagsSettingsProvider>,
    );

    expect(screen.queryByText("ALM-1")).not.toBeInTheDocument();
  });
});
