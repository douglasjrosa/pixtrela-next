import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { sampleSubTaskPreset } from "@/test/sample-subtask-preset";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";

import { SubTaskPresetListProvider } from "./subtask-preset-list-context";
import { SubtaskPresetListTableFrame } from "./subtask-preset-list-table-frame";

const loadMoreSubTaskPresets = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  loadMoreSubTaskPresets: (...args: unknown[]) =>
    loadMoreSubTaskPresets(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

const filters = {
  column: "name" as const,
  direction: "asc" as const,
};

const initialPresets: SubTaskPreset[] = [
  sampleSubTaskPreset({ documentId: "p1", name: "Primeiro" }),
];

describe("SubtaskPresetListTableFrame", () => {
  beforeEach(() => {
    loadMoreSubTaskPresets.mockReset();
    showErrorToast.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreSubTaskPresets.mockResolvedValueOnce({
      presets: [
        sampleSubTaskPreset({
          documentId: "p2",
          name: "Segundo",
          sharingType: "duration",
          maxSameTimeWorkers: 1,
        }),
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <SubTaskPresetListProvider openEdit={vi.fn()}>
        <SubtaskPresetListTableFrame
          filters={filters}
          initialPresets={initialPresets}
          initialHasMore
          initialPage={1}
          tableHeader={
            <thead>
              <tr>
                <th>Nome</th>
              </tr>
            </thead>
          }
          tableBody={
            <tbody>
              <tr>
                <td>Primeiro</td>
              </tr>
            </tbody>
          }
          mobileList={
            <ul>
              <li>Primeiro</li>
            </ul>
          }
        />
      </SubTaskPresetListProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreSubTaskPresets).toHaveBeenCalledWith(filters, 2);
    });
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "Segundo" }).length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.queryByRole("button", { name: "Carregar mais" }),
    ).not.toBeInTheDocument();
  });

  it("centers the load more button", () => {
    renderWithIntl(
      <SubTaskPresetListProvider openEdit={vi.fn()}>
        <SubtaskPresetListTableFrame
          filters={filters}
          initialPresets={initialPresets}
          initialHasMore
          initialPage={1}
          tableHeader={null}
          tableBody={null}
          mobileList={null}
        />
      </SubTaskPresetListProvider>,
    );

    const button = screen.getByRole("button", { name: "Carregar mais" });
    expect(button.parentElement).toHaveClass("justify-center");
  });
});
