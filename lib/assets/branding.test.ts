import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  APP_APPLE_TOUCH_ICON,
  APP_FAVICON_JPG,
  APP_FAVICON_PNG,
  APP_ICON_192,
  APP_ICON_512,
} from "./branding";

const PUBLIC_DIR = join(process.cwd(), "public");
const APP_DIR = join(process.cwd(), "app");

function publicFile(urlPath: string): string {
  return join(PUBLIC_DIR, urlPath.replace(/^\//, ""));
}

describe("branding assets", () => {
  it("points to existing public files", () => {
    for (const asset of [
      APP_FAVICON_PNG,
      APP_FAVICON_JPG,
      APP_ICON_192,
      APP_ICON_512,
      APP_APPLE_TOUCH_ICON,
    ]) {
      expect(existsSync(publicFile(asset))).toBe(true);
    }
  });

  it("includes Next.js app icon files derived from favicon.png", () => {
    expect(existsSync(join(APP_DIR, "icon.png"))).toBe(true);
    expect(existsSync(join(APP_DIR, "apple-icon.png"))).toBe(true);
  });
});
