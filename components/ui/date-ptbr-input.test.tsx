import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DatePtBrInput } from "./date-ptbr-input";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("DatePtBrInput", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("displays ISO value as dd/mm/yyyy", () => {
    render(
      <DatePtBrInput id="date" value="2026-07-18" onChange={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText("dd/mm/aaaa")).toHaveValue("18/07/2026");
  });

  it("commits valid pt-BR input as ISO on blur", () => {
    const onChange = vi.fn();
    render(
      <DatePtBrInput id="date" value="" allowEmpty onChange={onChange} />,
    );
    const input = screen.getByPlaceholderText("dd/mm/aaaa");
    fireEvent.change(input, { target: { value: "31/05/2026" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("2026-05-31");
  });

  it("clears value when allowEmpty and input is blank on blur", () => {
    const onChange = vi.fn();
    render(
      <DatePtBrInput
        id="date"
        value="2026-05-31"
        allowEmpty
        onChange={onChange}
      />,
    );
    const input = screen.getByPlaceholderText("dd/mm/aaaa");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("");
    expect(input).toHaveValue("");
  });

  it("opens the native date picker from the calendar button", () => {
    const showPicker = vi.fn();
    render(
      <DatePtBrInput id="date" value="2026-07-18" onChange={vi.fn()} />,
    );
    const native = document.getElementById(
      "date-native-picker",
    ) as HTMLInputElement;
    Object.defineProperty(native, "showPicker", {
      configurable: true,
      value: showPicker,
    });

    fireEvent.click(screen.getByRole("button", { name: "openCalendar" }));
    expect(showPicker).toHaveBeenCalledOnce();
  });

  it("commits ISO date when native picker changes", () => {
    const onChange = vi.fn();
    render(
      <DatePtBrInput id="date" value="2026-07-18" onChange={onChange} />,
    );
    const native = document.getElementById(
      "date-native-picker",
    ) as HTMLInputElement;
    fireEvent.change(native, { target: { value: "2026-08-01" } });
    expect(onChange).toHaveBeenCalledWith("2026-08-01");
    expect(screen.getByPlaceholderText("dd/mm/aaaa")).toHaveValue("01/08/2026");
  });
});
