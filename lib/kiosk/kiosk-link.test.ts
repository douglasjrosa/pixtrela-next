import { describe, expect, it, vi } from "vitest";

import {
  buildKioskColaboratorPath,
  buildKioskColaboratorUrl,
  copyKioskColaboratorLink,
} from "./kiosk-link";

describe("buildKioskColaboratorPath", () => {
  it("builds the kiosk route for a document id", () => {
    expect(buildKioskColaboratorPath("col-abc")).toBe("/kiosk/col-abc");
  });
});

describe("buildKioskColaboratorUrl", () => {
  it("prefixes the path with the app origin", () => {
    expect(buildKioskColaboratorUrl("col-abc", "https://pixtrela.com")).toBe(
      "https://pixtrela.com/kiosk/col-abc",
    );
  });
});

describe("copyKioskColaboratorLink", () => {
  it("writes the full kiosk url to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await copyKioskColaboratorLink("col-abc", "https://pixtrela.com");

    expect(writeText).toHaveBeenCalledWith(
      "https://pixtrela.com/kiosk/col-abc",
    );
  });
});
