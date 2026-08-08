import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { WelcomeOverlayHost } from "./welcome-overlay-host";
import {
  WELCOME_SESSION_KEY,
  stashWelcomePayload,
} from "@/lib/welcome/welcome-session";

const usePathname = vi.fn(() => "/kiosk/c1");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

describe("WelcomeOverlayHost", () => {
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
    usePathname.mockReturnValue("/kiosk/c1");
  });

  it("shows the welcome modal from a stashed payload", () => {
    stashWelcomePayload({
      name: "Ana Silva",
      greetingGender: "feminine",
      avatarUrl: "/uploads/a.jpg",
    });

    renderWithIntl(<WelcomeOverlayHost />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Bem vinda Ana!")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(WELCOME_SESSION_KEY)).toBeNull();
  });

  it("clears the modal after the welcome duration", () => {
    vi.useFakeTimers();
    stashWelcomePayload({ name: "Bruno" });

    renderWithIntl(<WelcomeOverlayHost />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    vi.useRealTimers();
  });
});
