import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SAMPLE_ACTION_ID } from "@/test/sample-subtask-preset";
import { renderWithIntl } from "@/test/test-utils";

import { SubTaskPresetForm } from "./subtask-preset-form";

const searchFactoryActions = vi.hoisted(() => vi.fn());

vi.mock("@/app/(app)/factory-actions/actions", () => ({
  searchFactoryActions: (...args: unknown[]) => searchFactoryActions(...args),
}));

vi.mock("@/components/subtasks/subtask-category-select", () => ({
  SubTaskCategorySelect: () => null,
}));

describe("SubTaskPresetForm", () => {
  beforeEach(() => {
    searchFactoryActions.mockReset();
    searchFactoryActions.mockResolvedValue([]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show action validation errors before submit", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithIntl(
      <SubTaskPresetForm
        formId="preset-edit"
        defaultValues={{
          name: "Corte das chapas das laterais",
          sharingType: "qty",
          maxSameTimeWorkers: 1,
          actionId: SAMPLE_ACTION_ID,
          subTaskCategoryId: null,
        }}
        actionName="Cortar compensado"
        onSubmit={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Ação");
    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(input).toHaveValue("Cortar compensad");
    expect(screen.queryByText("Invalid UUID")).not.toBeInTheDocument();
  });
});
