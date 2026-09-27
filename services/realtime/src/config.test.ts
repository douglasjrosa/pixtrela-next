import { describe, expect, it } from "vitest";
import { DEFAULT_PORT, REDIS_DEFAULT_URL } from "./constants.js";
import { loadConfig } from "./config.js";

const PUBLISH_SECRET = "abcdef0123456789abcdef0123456789";
const JWT_SECRET = "0123456789abcdef0123456789abcdef";

describe("loadConfig", () => {
  it("requires both secrets and applies local defaults", () => {
    expect(() => loadConfig({})).toThrow(/REALTIME_PUBLISH_SECRET/);
    expect(() =>
      loadConfig({ REALTIME_PUBLISH_SECRET: PUBLISH_SECRET }),
    ).toThrow(/REALTIME_JWT_SECRET/);

    expect(
      loadConfig({
        REALTIME_PUBLISH_SECRET: PUBLISH_SECRET,
        REALTIME_JWT_SECRET: JWT_SECRET,
      }),
    ).toEqual({
      port: DEFAULT_PORT,
      redisUrl: REDIS_DEFAULT_URL,
      publishSecret: PUBLISH_SECRET,
      jwtSecret: JWT_SECRET,
    });
  });

  it("rejects a secret shorter than the minimum", () => {
    expect(() =>
      loadConfig({
        REALTIME_PUBLISH_SECRET: "short",
        REALTIME_JWT_SECRET: JWT_SECRET,
      }),
    ).toThrow(/REALTIME_PUBLISH_SECRET/);
  });
});
