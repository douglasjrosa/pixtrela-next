import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

const createSubTaskPreset = vi.fn();
const updateSubTaskPreset = vi.fn();
const deleteSubTaskPreset = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  createSubTaskPreset: (...args: unknown[]) => createSubTaskPreset(...args),
  updateSubTaskPreset: (...args: unknown[]) => updateSubTaskPreset(...args),
  deleteSubTaskPreset: (...args: unknown[]) => deleteSubTaskPreset(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

import { SubTaskPresetManager } from "./subtask-preset-manager";

const presets = [
  {
    documentId: "p1",
    name: "Corte",
    sharingType: "qty" as const,
    maxSameTimeWorkers: 2,
    expectedTime: 120,
  },
];

describe("SubTaskPresetManager", () => {
  it("renders presets and opens create modal from plus button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SubTaskPresetManager presets={presets} />);

    expect(screen.getByText("Corte")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Novo modelo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Novo modelo" })).toBeInTheDocument();
  });

  it("opens edit modal when clicking a row name", async () => {
    const user = userEvent.setup();
    renderWithIntl(<SubTaskPresetManager presets={presets} />);

    await user.click(screen.getByRole("button", { name: "Corte" }));
    expect(screen.getByRole("heading", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Corte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("saves edits through updateSubTaskPreset", async () => {
    const user = userEvent.setup();
    updateSubTaskPreset.mockResolvedValue(undefined);
    renderWithIntl(<SubTaskPresetManager presets={presets} />);

    await user.click(screen.getByRole("button", { name: "Corte" }));
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Corte 2");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(updateSubTaskPreset).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ name: "Corte 2" }),
    );
  });
});
