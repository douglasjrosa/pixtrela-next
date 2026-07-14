import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: vi.fn(async () => []),
}));

import { TemplateSubTaskInlineForm } from "./template-subtask-inline-form";

const defaultValues = {
  name: "Corte",
  qty: 1,
  expectedTime: 60,
  sharingType: "duration" as const,
  maxSameTimeWorkers: 1,
  dependencyIds: [],
};

describe("TemplateSubTaskInlineForm", () => {
  it("does not render a save button", () => {
    renderWithIntl(
      <TemplateSubTaskInlineForm
        formKey="row-0"
        defaultValues={defaultValues}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
  });

  it("calls onChange when a field is edited", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <TemplateSubTaskInlineForm
        formKey="row-0"
        defaultValues={defaultValues}
        onChange={onChange}
      />,
    );

    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Solda");

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall?.name).toBe("Solda");
  });
});
