import { afterEach, describe, expect, it } from "vitest";

import { getAppBaseUrl } from "@/lib/app/app-base-url";

const ENV_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "AUTH_URL",
  "VERCEL_URL",
] as const;

describe("getAppBaseUrl", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("prefers NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com/";
    process.env.AUTH_URL = "https://auth.example.com";
    expect(getAppBaseUrl()).toBe("https://app.example.com");
  });

  it("falls back to AUTH_URL when NEXT_PUBLIC_APP_URL is unset", () => {
    process.env.AUTH_URL = "https://app.example.com/";
    expect(getAppBaseUrl()).toBe("https://app.example.com");
  });

  it("falls back to VERCEL_URL when public and auth URLs are unset", () => {
    process.env.VERCEL_URL = "preview-abc.vercel.app";
    expect(getAppBaseUrl()).toBe("https://preview-abc.vercel.app");
  });

  it("defaults to localhost for local dev", () => {
    expect(getAppBaseUrl()).toBe("http://localhost:3000"); // pragma: allowlist secret
  });
});
