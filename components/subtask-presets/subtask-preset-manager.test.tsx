import { describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { sampleSubTaskPreset } from "@/test/sample-subtask-preset";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";

const createSubTaskPreset = vi.fn();
const updateSubTaskPreset = vi.fn();
const deleteSubTaskPreset = vi.fn();
const refresh = vi.fn();
const useRegisterTemplatesPageCreateAction = vi.fn();

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  createSubTaskPreset: (...args: unknown[]) => createSubTaskPreset(...args),
  updateSubTaskPreset: (...args: unknown[]) => updateSubTaskPreset(...args),
  deleteSubTaskPreset: (...args: unknown[]) => deleteSubTaskPreset(...args),
}));

vi.mock("@/app/(app)/settings/subtasks/actions", () => ({
  listCategoryOptions: vi.fn(async () => []),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/templates/templates-page-actions-context", () => ({
  useRegisterTemplatesPageCreateAction: (...args: unknown[]) =>
    useRegisterTemplatesPageCreateAction(...args),
}));

vi.mock("@/components/factory-actions/factory-action-search-field", () => ({
  FactoryActionSearchField: () => <div data-testid="action-search" />,
}));

vi.mock("@/components/subtasks/subtask-category-select", () => ({
  SubTaskCategorySelect: () => <div data-testid="category-select" />,
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

import { SubtaskPresetListRowPresentational } from "./subtask-preset-list-row-presentational";
import { SubTaskPresetManager } from "./subtask-preset-manager";

const presets: SubTaskPreset[] = [sampleSubTaskPreset()];

function renderManagerWithRow() {
  return renderWithIntl(
    <SubTaskPresetManager>
      <table>
        <tbody>
          <SubtaskPresetListRowPresentational
            preset={presets[0]!}
            variant="table"
            labels={{
              sharingType: "Por quantidade",
              actionName: "Grampear quadro",
              inactive: "Inativo",
              selectRow: "Selecionar Corte",
            }}
          />
        </tbody>
      </table>
    </SubTaskPresetManager>,
  );
}

describe("SubTaskPresetManager", () => {
  it("renders presets and opens create modal from registered chrome action", async () => {
    renderManagerWithRow();

    expect(screen.getByText("Corte")).toBeInTheDocument();
    const openCreate = useRegisterTemplatesPageCreateAction.mock.calls[0]?.[1];
    expect(openCreate).toBeTypeOf("function");
    act(() => {
      openCreate!();
    });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Novo modelo" }),
    ).toBeInTheDocument();
  });

  it("opens edit modal when clicking a row name", async () => {
    const user = userEvent.setup();
    renderManagerWithRow();

    await user.click(screen.getByRole("button", { name: "Corte" }));
    expect(screen.getByRole("heading", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Corte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("saves edits through updateSubTaskPreset", async () => {
    const user = userEvent.setup();
    updateSubTaskPreset.mockResolvedValue(undefined);
    renderManagerWithRow();

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
