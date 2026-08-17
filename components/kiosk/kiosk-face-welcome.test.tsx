import { describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskFaceWelcome } from "./kiosk-face-welcome";

describe("KioskFaceWelcome", () => {
  it("shows feminine welcome and calls onDone after duration", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();

    renderWithIntl(
      <KioskFaceWelcome
        name="Ana Silva"
        greetingGender="feminine"
        avatarUrl="/api/media/a.jpg"
        onDone={onDone}
        durationMs={2000}
      />,
    );

    expect(screen.getByText("Bem vinda Ana!")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Ana Silva/i })).toHaveAttribute(
      "src",
      "/api/media/a.jpg",
    );

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDone).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("fades the whole modal before calling onDone", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();

    renderWithIntl(
      <KioskFaceWelcome
        name="Ana"
        onDone={onDone}
        durationMs={1000}
        fadeMs={300}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-fading", "false");
    expect(dialog.className).toMatch(/fixed/);

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(dialog).toHaveAttribute("data-fading", "true");
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onDone).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("shows masculine welcome by default", () => {
    renderWithIntl(
      <KioskFaceWelcome name="Bruno Costa" onDone={() => undefined} />,
    );
    expect(screen.getByText("Bem vindo Bruno!")).toBeInTheDocument();
  });

  it("shows loading under the greeting and waits until ready", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();

    renderWithIntl(
      <KioskFaceWelcome
        name="Bruno Costa"
        showLoading
        ready={false}
        onDone={onDone}
        durationMs={800}
        fadeMs={300}
      />,
    );

    expect(screen.getByText("Bem vindo Bruno!")).toBeInTheDocument();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(onDone).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
