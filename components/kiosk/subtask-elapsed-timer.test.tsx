import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/test-utils";

import { SubtaskElapsedTimer } from "./subtask-elapsed-timer";

describe("SubtaskElapsedTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses default styling while elapsed is within expected time", () => {
    renderWithIntl(
      <SubtaskElapsedTimer
        startedAt="2026-06-05T10:00:00.000Z"
        expectedTime={120}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    const timer = screen.getByText("1min 0s");
    expect(timer).not.toHaveClass("text-destructive");
  });

  it("turns red when elapsed exceeds expected time", () => {
    renderWithIntl(
      <SubtaskElapsedTimer
        startedAt="2026-06-05T10:00:00.000Z"
        baseSeconds={90}
        expectedTime={120}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(31_000);
    });

    const timer = screen.getByText("2min 1s");
    expect(timer).toHaveClass("text-destructive");
  });
});
