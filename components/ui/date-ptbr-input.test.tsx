import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DatePtBrInput } from "./date-ptbr-input";

describe("DatePtBrInput", () => {
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
});
