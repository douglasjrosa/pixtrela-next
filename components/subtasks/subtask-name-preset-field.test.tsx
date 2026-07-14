import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { SubTaskNamePresetField } from "./subtask-name-preset-field";

const searchSubTaskPresets = vi.hoisted(() => vi.fn());

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: (...args: unknown[]) => searchSubTaskPresets(...args),
}));

const preset: SubTaskPreset = {
  documentId: "p1",
  name: "Corte dos sarrafos",
  sharingType: "qty",
  maxSameTimeWorkers: 2,
  expectedTime: 120,
};

function Harness({
  onApplyPreset,
}: {
  onApplyPreset: (preset: SubTaskPreset) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <SubTaskNamePresetField
      id="name"
      label="Nome"
      value={value}
      enabled
      onChange={setValue}
      onApplyPreset={onApplyPreset}
    />
  );
}

describe("SubTaskNamePresetField", () => {
  beforeEach(() => {
    searchSubTaskPresets.mockReset();
    searchSubTaskPresets.mockResolvedValue([preset]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not search before 3 characters", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<Harness onApplyPreset={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "ab");
    await vi.advanceTimersByTimeAsync(400);

    expect(searchSubTaskPresets).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("searches and applies a preset when an option is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onApplyPreset = vi.fn();

    renderWithIntl(<Harness onApplyPreset={onApplyPreset} />);

    await user.type(screen.getByLabelText("Nome"), "cor");
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(searchSubTaskPresets).toHaveBeenCalledWith("cor");
    });
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Corte dos sarrafos" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Corte dos sarrafos" }));
    expect(onApplyPreset).toHaveBeenCalledWith(preset);
  });
});
