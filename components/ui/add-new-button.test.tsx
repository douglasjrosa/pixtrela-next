import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { AddNewButton } from "./add-new-button";

describe("AddNewButton", () => {
  it("renders an accessible icon button with title styling", () => {
    renderWithIntl(<AddNewButton label="Nova tarefa" onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Nova tarefa" });
    expect(button.className).toContain("font-display");
    expect(button.className).toContain("bg-foreground");
    expect(button.className).toContain("size-10");
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithIntl(<AddNewButton label="Nova tarefa" onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Nova tarefa" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
