import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { KIOSK_IDLE_MS } from "@/lib/business/kiosk-idle";
import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import { KioskIdleProvider } from "./kiosk-idle-provider";
import { useKioskIdle } from "./use-kiosk-idle";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => "/kiosk/col-1",
}));

function wrapper({ children }: { children: ReactNode }) {
  return <KioskIdleProvider>{children}</KioskIdleProvider>;
}

describe("useKioskIdle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    refresh.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("navigates to kiosk home after idle period", () => {
    renderHook(() => useKioskIdle(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(KIOSK_IDLE_MS + 200);
    });

    expect(replace).toHaveBeenCalledWith(KIOSK_HOME_PATH);
  });

  it("resets idle timer on manual reset", () => {
    const { result } = renderHook(() => useKioskIdle(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
      result.current.reset();
      vi.advanceTimersByTime(KIOSK_IDLE_MS - 1000);
    });

    expect(replace).not.toHaveBeenCalled();
  });
});
