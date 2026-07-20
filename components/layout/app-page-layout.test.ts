import { describe, expect, it } from "vitest";

import {
  APP_BOARD_SHELL_CLASS,
  APP_CONTENT_FRAME_CLASS,
  APP_CONTENT_HEIGHT_CLASS,
  APP_CONTENT_SURFACE_CLASS,
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
} from "./app-page-layout";

describe("app-page-layout", () => {
  it("fills the opaque content surface under the fixed nav", () => {
    expect(APP_CONTENT_HEIGHT_CLASS).toBe("min-h-0 flex-1");
    expect(APP_CONTENT_FRAME_CLASS).toContain("p-3");
    expect(APP_CONTENT_SURFACE_CLASS).toContain("border");
    expect(APP_CONTENT_SURFACE_CLASS).not.toContain("bg-card");
    expect(APP_CONTENT_SURFACE_CLASS).not.toContain("rounded-2xl");
    expect(APP_LIST_PAGE_SHELL_CLASS).toContain(APP_CONTENT_HEIGHT_CLASS);
    expect(APP_LIST_PAGE_SHELL_CLASS).toContain("max-[500px]:p-3");
    expect(APP_LIST_PAGE_TITLE_CLASS).toContain("max-[500px]:text-lg");
    expect(APP_BOARD_SHELL_CLASS).toContain("overflow-hidden");
  });
});
