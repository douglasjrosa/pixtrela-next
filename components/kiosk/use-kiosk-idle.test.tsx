import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { KIOSK_IDLE_MS } from "@/lib/business/kiosk-idle";
import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import { useKioskIdle } from "./use-kiosk-idle";

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("useKioskIdle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("navigates to kiosk home after idle period", () => {
    renderHook(() => useKioskIdle());

    act(() => {
      vi.advanceTimersByTime(KIOSK_IDLE_MS);
    });

    expect(push).toHaveBeenCalledWith(KIOSK_HOME_PATH);
  });

  it("resets idle timer on activity", () => {
    const { result } = renderHook(() => useKioskIdle());

    act(() => {
      vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
      result.current.reset();
      vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
    });

    expect(push).not.toHaveBeenCalled();
  });
});
