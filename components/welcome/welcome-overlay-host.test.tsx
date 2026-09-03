import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { WelcomeOverlayHost } from "./welcome-overlay-host";
import {
  markKioskColaboratorReady,
  resetKioskColaboratorReady,
} from "@/lib/welcome/kiosk-welcome-ready";
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
    resetKioskColaboratorReady();
  });

  it("shows the welcome modal from a stashed payload", async () => {
    stashWelcomePayload({
      name: "Ana Silva",
      greetingGender: "feminine",
      avatarUrl: "/uploads/a.jpg",
    });

    await act(async () => {
      renderWithIntl(<WelcomeOverlayHost />);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Bem vinda Ana!")).toBeInTheDocument();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    // Payload stays until onDone so Strict Mode remounts still see it.
    expect(window.sessionStorage.getItem(WELCOME_SESSION_KEY)).toBeTruthy();
  });

  it("keeps welcome until the kiosk queue is ready", async () => {
    vi.useFakeTimers();
    stashWelcomePayload({ name: "Bruno" });

    await act(async () => {
      renderWithIntl(<WelcomeOverlayHost />);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      markKioskColaboratorReady();
    });
    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.sessionStorage.getItem(WELCOME_SESSION_KEY)).toBeNull();
    vi.useRealTimers();
  });

  it("clears a non-kiosk welcome after the duration", async () => {
    vi.useFakeTimers();
    usePathname.mockReturnValue("/board");
    stashWelcomePayload({ name: "Bruno" });

    await act(async () => {
      renderWithIntl(<WelcomeOverlayHost />);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.sessionStorage.getItem(WELCOME_SESSION_KEY)).toBeNull();
    vi.useRealTimers();
  });
});
