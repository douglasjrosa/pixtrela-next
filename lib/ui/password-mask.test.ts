import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  appendPasswordChars,
  buildPasswordDisplay,
  createPasswordRevealState,
  deletePasswordRange,
  nextPasswordMaskTickMs,
  removeLastPasswordChar,
  replacePasswordRange,
} from "./password-mask";

describe("password-mask", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reveals each appended character for one second", () => {
    let state = createPasswordRevealState();
    state = appendPasswordChars(state, "a", Date.now());
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("a");

    vi.advanceTimersByTime(999);
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("a");

    vi.advanceTimersByTime(2);
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("•");
  });

  it("masks the previous character when the next one is typed", () => {
    let state = appendPasswordChars(createPasswordRevealState(), "a", Date.now());
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("a");

    state = appendPasswordChars(state, "b", Date.now());
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("•b");
  });

  it("masks older characters after one second when no next key is typed", () => {
    let state = appendPasswordChars(createPasswordRevealState(), "a", Date.now());
    vi.advanceTimersByTime(1001);
    state = appendPasswordChars(state, "b", Date.now());
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("•b");
  });

  it("replaces a selected range when new characters are inserted", () => {
    const state = replacePasswordRange(
      appendPasswordChars(createPasswordRevealState(), "abcd", Date.now()),
      1,
      3,
      "z",
      Date.now(),
    );

    expect(state.value).toBe("azd");
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("•z•");
  });

  it("removes the last character and its reveal timer", () => {
    let state = appendPasswordChars(createPasswordRevealState(), "ab", Date.now());
    state = removeLastPasswordChar(state);
    expect(state.value).toBe("a");
    expect(buildPasswordDisplay(state, false, Date.now())).toBe("a");
  });

  it("deletes a selected range", () => {
    const state = deletePasswordRange(
      appendPasswordChars(createPasswordRevealState(), "abcd", Date.now()),
      1,
      3,
    );

    expect(state.value).toBe("ad");
  });

  it("shows the full value when reveal-all is enabled", () => {
    const state = appendPasswordChars(createPasswordRevealState(), "secret", Date.now());
    expect(buildPasswordDisplay(state, true, Date.now())).toBe("secret");
  });

  it("schedules the next mask refresh before the earliest expiry", () => {
    let state = appendPasswordChars(createPasswordRevealState(), "a", Date.now());
    vi.advanceTimersByTime(400);
    state = appendPasswordChars(state, "b", Date.now());

    expect(nextPasswordMaskTickMs(state, Date.now())).toBe(1001);
  });
});
