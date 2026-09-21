import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, screen } from "@testing-library/react";

import { PasswordInput } from "@/components/ui/password-input";
import { renderWithIntl } from "@/test/test-utils";

describe("PasswordInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("masks typed characters after one second", () => {
    renderWithIntl(<PasswordInput id="password" aria-label="Senha" />);

    const field = screen.getByLabelText("Senha");
    act(() => {
      fireEvent.keyDown(field, { key: "a" });
    });

    expect(field).toHaveValue("a");

    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(field).toHaveValue("•");
  });

  it("masks the previous character when the next one is typed", () => {
    renderWithIntl(<PasswordInput id="password" aria-label="Senha" />);

    const field = screen.getByLabelText("Senha");
    act(() => {
      fireEvent.keyDown(field, { key: "a" });
      fireEvent.keyDown(field, { key: "b" });
    });

    expect(field).toHaveValue("•b");
  });

  it("replaces selected characters when a new key is pressed", () => {
    renderWithIntl(<PasswordInput id="password" aria-label="Senha" />);

    const field = screen.getByLabelText("Senha") as HTMLInputElement;
    act(() => {
      fireEvent.keyDown(field, { key: "a" });
      fireEvent.keyDown(field, { key: "b" });
      fireEvent.keyDown(field, { key: "c" });
    });

    act(() => {
      field.setSelectionRange(0, 2);
      fireEvent.select(field);
      fireEvent.keyDown(field, { key: "z" });
    });

    expect(field).toHaveValue("z•");
  });

  it("reveals the full password when the eye button is pressed", () => {
    renderWithIntl(<PasswordInput id="password" aria-label="Senha" />);

    const field = screen.getByLabelText("Senha");
    fireEvent.keyDown(field, { key: "a" });
    fireEvent.keyDown(field, { key: "b" });
    fireEvent.keyDown(field, { key: "c" });
    vi.advanceTimersByTime(1001);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(field).toHaveValue("abc");
  });

  it("accepts virtual keyboard append after the display is masked", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <PasswordInput id="password" aria-label="Senha" onChange={onChange} />,
    );

    const field = screen.getByLabelText("Senha");
    act(() => {
      fireEvent.keyDown(field, { key: "1" });
    });
    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(field).toHaveValue("•");

    act(() => {
      fireEvent.change(field, {
        target: { value: "•2", selectionStart: 2, selectionEnd: 2 },
      });
    });

    expect(document.getElementById("password-value")).toHaveValue("12");
    expect(field).toHaveValue("•2");
  });

  it("appends when a masked field is replaced with a single character", () => {
    renderWithIntl(<PasswordInput id="password" aria-label="Senha" />);

    const field = screen.getByLabelText("Senha");
    act(() => {
      fireEvent.keyDown(field, { key: "1" });
    });
    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(field).toHaveValue("•");

    act(() => {
      fireEvent.change(field, { target: { value: "2" } });
    });

    expect(document.getElementById("password-value")).toHaveValue("12");
  });

  it("uses a native password field when forceNative is set", () => {
    renderWithIntl(
      <PasswordInput id="password" aria-label="Senha" forceNative />,
    );

    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
  });

  it("uses native password input on coarse pointers", () => {
    const matchMedia = vi
      .spyOn(window, "matchMedia")
      .mockImplementation((query: string) => ({
        matches: query === "(pointer: coarse)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

    renderWithIntl(<PasswordInput id="password" aria-label="Senha" />);

    const field = screen.getByLabelText("Senha");
    expect(field).toHaveAttribute("type", "password");
    fireEvent.change(field, { target: { value: "secret1" } });
    expect(field).toHaveValue("secret1");
    expect(document.getElementById("password-value")).toHaveValue("secret1");

    matchMedia.mockRestore();
  });

  it("accepts plaintext autofill via change while masked", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <PasswordInput id="password" aria-label="Senha" onChange={onChange} />,
    );

    const field = screen.getByLabelText("Senha");
    fireEvent.change(field, { target: { value: "secret1" } });

    expect(onChange).toHaveBeenCalled();
    const event = onChange.mock.calls.at(-1)?.[0] as {
      target: { value: string };
    };
    expect(event.target.value).toBe("secret1");
    expect(document.getElementById("password-value")).toHaveValue("secret1");
  });
});
