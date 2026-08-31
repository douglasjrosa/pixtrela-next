import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { findRawImgElementViolations } from "./scan-raw-img-elements";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("raw img element policy", () => {
  it("does not use <img> in app source (use AppImage / next/image instead)", () => {
    const violations = findRawImgElementViolations(projectRoot);
    expect(violations).toEqual([]);
  });
});
