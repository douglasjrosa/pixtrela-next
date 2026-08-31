import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const showConfirmToast = vi.fn();
const push = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showConfirmToast: (...args: unknown[]) => showConfirmToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/user-1/store",
}));

import {
  getInternalNavigationPath,
  isModifiedNavigationClick,
  useUnsavedLeaveGuard,
} from "./use-unsaved-leave-guard";

describe("getInternalNavigationPath", () => {
  it("returns same-origin in-app paths and ignores hash-only links", () => {
    const anchor = document.createElement("a");
    anchor.href = "/user-1/orders";
    expect(getInternalNavigationPath(anchor)).toBe("/user-1/orders");

    anchor.href = "/user-1/store#top";
    expect(getInternalNavigationPath(anchor)).toBeNull();

    anchor.href = "https://example.com/other";
    expect(getInternalNavigationPath(anchor)).toBeNull();
  });
});

describe("isModifiedNavigationClick", () => {
  it("detects non-primary clicks", () => {
    expect(
      isModifiedNavigationClick({ button: 1, metaKey: false } as MouseEvent),
    ).toBe(true);
    expect(
      isModifiedNavigationClick({ button: 0, metaKey: true } as MouseEvent),
    ).toBe(true);
    expect(
      isModifiedNavigationClick({ button: 0, metaKey: false } as MouseEvent),
    ).toBe(false);
  });
});

describe("useUnsavedLeaveGuard", () => {
  beforeEach(() => {
    showConfirmToast.mockReset();
    push.mockReset();
    window.history.replaceState({}, "", "/user-1/store");
  });

  it("does nothing when disabled", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    renderHook(() =>
      useUnsavedLeaveGuard({
        enabled: false,
        message: "Sair?",
        yesLabel: "Sim",
        noLabel: "Não",
      }),
    );
    expect(addSpy).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it("shows confirm toast when leaving through an in-app link", () => {
    renderHook(() =>
      useUnsavedLeaveGuard({
        enabled: true,
        message: "Sair?",
        yesLabel: "Sim",
        noLabel: "Não",
      }),
    );

    const link = document.createElement("a");
    link.href = "/user-1/orders";
    document.body.appendChild(link);

    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    Object.defineProperty(event, "target", { value: link });

    act(() => {
      link.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(showConfirmToast).toHaveBeenCalledOnce();
    const options = showConfirmToast.mock.calls[0][0] as {
      onYes: () => void;
    };
    options.onYes();
    expect(push).toHaveBeenCalledWith("/user-1/orders");

    link.remove();
  });
});
