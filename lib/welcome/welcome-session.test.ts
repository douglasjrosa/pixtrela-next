import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  WELCOME_SESSION_KEY,
  consumeWelcomePayload,
  isWelcomePayload,
  stashWelcomePayload,
} from "./welcome-session";

describe("welcome-session", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("validates welcome payloads", () => {
    expect(isWelcomePayload({ name: "Ana" })).toBe(true);
    expect(isWelcomePayload({ name: "" })).toBe(false);
    expect(isWelcomePayload(null)).toBe(false);
  });

  it("stashes and consumes a payload once", () => {
    stashWelcomePayload({
      name: "Ana",
      greetingGender: "feminine",
      avatarUrl: "/uploads/a.jpg",
    });
    expect(window.sessionStorage.getItem(WELCOME_SESSION_KEY)).toBeTruthy();

    const first = consumeWelcomePayload();
    expect(first).toEqual({
      name: "Ana",
      greetingGender: "feminine",
      avatarUrl: "/uploads/a.jpg",
    });
    expect(consumeWelcomePayload()).toBeNull();
  });
});
