import { describe, expect, it } from "vitest";
import { getRedirectError } from "next/dist/client/components/redirect";

import { rethrowIfNavigationError } from "./rethrow";

describe("rethrowIfNavigationError", () => {
  it("re-throws redirect errors", () => {
    const redirectError = getRedirectError("/login", "replace");
    expect(() => rethrowIfNavigationError(redirectError)).toThrow();
  });

  it("ignores regular errors", () => {
    expect(() => rethrowIfNavigationError(new Error("fail"))).not.toThrow();
  });
});
