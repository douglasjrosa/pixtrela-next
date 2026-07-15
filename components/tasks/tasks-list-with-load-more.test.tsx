import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { TasksListWithLoadMore } from "./tasks-list-with-load-more";

const loadMoreTasks = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  loadMoreTasks: (...args: unknown[]) => loadMoreTasks(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const filters = {
  statuses: ["waiting"] as Array<"waiting">,
  from: "2026-06-01",
};

const initialTasks = [
  {
    documentId: "t1",
    name: "Primeira",
    qty: 1,
    index: 0,
    status: "waiting" as const,
    active: true,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
    deliveryDate: "2026-07-01",
  },
];

describe("TasksListWithLoadMore", () => {
  beforeEach(() => {
    loadMoreTasks.mockReset();
    showErrorToast.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreTasks.mockResolvedValueOnce({
      tasks: [
        {
          documentId: "t2",
          name: "Segunda",
          qty: 1,
          index: 1,
          status: "waiting",
          active: true,
          totalExpectedTime: 0,
          totalTimeSpent: 0,
          deliveryDate: "2026-07-02",
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <TasksListWithLoadMore
        filters={filters}
        initialTasks={initialTasks}
        initialHasMore
        initialPage={1}
      />,
    );

    expect(screen.getAllByRole("link", { name: "Primeira" }).length).toBeGreaterThan(
      0,
    );
    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreTasks).toHaveBeenCalledWith(filters, 2);
    });
    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Segunda" }).length).toBeGreaterThan(
        0,
      );
    });
    expect(
      screen.queryByRole("button", { name: "Carregar mais" }),
    ).not.toBeInTheDocument();
  });
});
