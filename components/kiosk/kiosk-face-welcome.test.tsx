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
        avatarUrl="http://127.0.0.1:1337/uploads/a.jpg"
        onDone={onDone}
        durationMs={2000}
      />,
    );

    expect(screen.getByText("Bem vinda Ana!")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Ana Silva/i })).toHaveAttribute(
      "src",
      "/api/strapi-media?path=%2Fuploads%2Fa.jpg",
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

  it("shows masculine welcome by default", () => {
    renderWithIntl(
      <KioskFaceWelcome name="Bruno Costa" onDone={() => undefined} />,
    );
    expect(screen.getByText("Bem vindo Bruno!")).toBeInTheDocument();
  });
});
