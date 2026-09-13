import { describe, expect, it, vi } from "vitest";

import { reloadCurrentDocument } from "./reload-document";

describe("reloadCurrentDocument", () => {
  it("reloads the current window location", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });

    reloadCurrentDocument();

    expect(reload).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
