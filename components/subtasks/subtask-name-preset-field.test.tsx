import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { sampleSubTaskPreset } from "@/test/sample-subtask-preset";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";
import { SubTaskNamePresetField } from "./subtask-name-preset-field";

const searchSubTaskPresets = vi.hoisted(() => vi.fn());

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: (...args: unknown[]) => searchSubTaskPresets(...args),
}));

const preset: SubTaskPreset = sampleSubTaskPreset({
  name: "Corte dos sarrafos",
});

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
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not show the list when search returns no presets", async () => {
    searchSubTaskPresets.mockResolvedValue([]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<Harness onApplyPreset={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "xyz");
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(searchSubTaskPresets).toHaveBeenCalledWith("xyz");
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nenhum preset encontrado."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Buscando presets...")).not.toBeInTheDocument();
  });

  it("shows suggestions again only after the user types", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithIntl(<Harness onApplyPreset={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "cor");
    await vi.advanceTimersByTimeAsync(400);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Corte dos sarrafos" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Nome"), "t");
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(searchSubTaskPresets).toHaveBeenCalledWith("cort");
    });
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
  });

  it("shows a Portuguese required-name error", () => {
    renderWithIntl(
      <SubTaskNamePresetField
        id="name"
        label="Nome"
        value=""
        enabled
        errorMessage="nameRequired"
        onChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
    expect(screen.queryByText(/Too small/i)).not.toBeInTheDocument();
  });

  it("never shows leftover English Zod too_small text", () => {
    renderWithIntl(
      <SubTaskNamePresetField
        id="name"
        label="Nome"
        value=""
        enabled
        errorMessage="Too small: expected string to have >=1 characters"
        onChange={vi.fn()}
        onApplyPreset={vi.fn()}
      />,
    );

    expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
    expect(screen.queryByText(/Too small/i)).not.toBeInTheDocument();
  });
});
