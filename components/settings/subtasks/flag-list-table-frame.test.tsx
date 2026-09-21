import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { FlagListTableFrame } from "./flag-list-table-frame";

const loadMoreFlags = vi.fn();
const bulkDeleteFlags = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/settings/subtasks/actions", () => ({
  loadMoreFlags: (...args: unknown[]) => loadMoreFlags(...args),
  bulkDeleteFlags: (...args: unknown[]) => bulkDeleteFlags(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const filters = { column: "code" as const, direction: "asc" as const };

const initialItems = [
  {
    id: "f1",
    code: "MAD-1",
    categoryName: "Madeira",
    index: 1,
    occupied: false,
  },
  {
    id: "f2",
    code: "MAD-2",
    categoryName: "Madeira",
    index: 2,
    occupied: false,
  },
];

describe("FlagListTableFrame bulk delete", () => {
  beforeEach(() => {
    loadMoreFlags.mockReset();
    bulkDeleteFlags.mockReset();
    showErrorToast.mockReset();
    showSuccessToast.mockReset();
    refresh.mockReset();
  });

  it("shows bulk delete after selecting a flag", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <FlagListTableFrame
        filters={filters}
        initialItems={initialItems}
        initialHasMore={false}
      />,
    );

    await user.click(
      screen.getAllByRole("checkbox", { name: "Selecionar MAD-1" })[0]!,
    );

    expect(
      screen.getByRole("button", { name: "Excluir selecionadas" }),
    ).toBeInTheDocument();
  });

  it("bulk deletes selected flags after confirmation", async () => {
    const user = userEvent.setup();
    bulkDeleteFlags.mockResolvedValue(undefined);
    renderWithIntl(
      <FlagListTableFrame
        filters={filters}
        initialItems={initialItems}
        initialHasMore={false}
      />,
    );

    await user.click(
      screen.getAllByRole("checkbox", { name: "Selecionar MAD-1" })[0]!,
    );
    await user.click(
      screen.getByRole("button", { name: "Excluir selecionadas" }),
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => {
      expect(bulkDeleteFlags).toHaveBeenCalledWith(["f1"]);
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: "MAD-1" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("link", { name: "MAD-2" }).length).toBeGreaterThan(
      0,
    );
    expect(showSuccessToast).toHaveBeenCalled();
  });
});
