import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { CategoryListTableFrame } from "./category-list-table-frame";

const loadMoreCategories = vi.fn();
const bulkDeleteCategories = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/settings/subtasks/actions", () => ({
  loadMoreCategories: (...args: unknown[]) => loadMoreCategories(...args),
  bulkDeleteCategories: (...args: unknown[]) => bulkDeleteCategories(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const filters = { column: "name" as const, direction: "asc" as const };

const initialItems = [
  { id: "c1", name: "Madeira", ref: "MAD", description: null },
  { id: "c2", name: "Metal", ref: "MET", description: "Aço" },
];

describe("CategoryListTableFrame bulk delete", () => {
  beforeEach(() => {
    loadMoreCategories.mockReset();
    bulkDeleteCategories.mockReset();
    showErrorToast.mockReset();
    showSuccessToast.mockReset();
    refresh.mockReset();
  });

  it("shows bulk delete after selecting a category", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <CategoryListTableFrame
        filters={filters}
        initialItems={initialItems}
        initialHasMore={false}
      />,
    );

    await user.click(
      screen.getAllByRole("checkbox", { name: "Selecionar Madeira" })[0]!,
    );

    expect(
      screen.getByRole("button", { name: "Excluir selecionadas" }),
    ).toBeInTheDocument();
  });

  it("bulk deletes selected categories after confirmation", async () => {
    const user = userEvent.setup();
    bulkDeleteCategories.mockResolvedValue(undefined);
    renderWithIntl(
      <CategoryListTableFrame
        filters={filters}
        initialItems={initialItems}
        initialHasMore={false}
      />,
    );

    await user.click(
      screen.getAllByRole("checkbox", { name: "Selecionar Madeira" })[0]!,
    );
    await user.click(
      screen.getByRole("button", { name: "Excluir selecionadas" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(bulkDeleteCategories).toHaveBeenCalledWith(["c1"]);
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "Madeira" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("link", { name: "Metal" }).length).toBeGreaterThan(
      0,
    );
    expect(showSuccessToast).toHaveBeenCalled();
  });
});
