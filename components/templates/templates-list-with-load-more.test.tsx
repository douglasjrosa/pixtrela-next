import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { TemplatesListWithLoadMore } from "./templates-list-with-load-more";

const loadMoreTemplates = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/templates/actions", () => ({
  loadMoreTemplates: (...args: unknown[]) => loadMoreTemplates(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const filters = {};

const initialTemplates = [
  {
    documentId: "tpl1",
    name: "Primeiro",
    code: "1",
    subTaskCount: 0,
  },
];

describe("TemplatesListWithLoadMore", () => {
  beforeEach(() => {
    loadMoreTemplates.mockReset();
    showErrorToast.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreTemplates.mockResolvedValueOnce({
      templates: [
        {
          documentId: "tpl2",
          name: "Segundo",
          code: "2",
          subTaskCount: 1,
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <TemplatesListWithLoadMore
        filters={filters}
        initialTemplates={initialTemplates}
        initialHasMore
        initialPage={1}
      />,
    );

    expect(
      screen.getAllByRole("link", { name: "Primeiro" }).length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(
        screen.getAllByRole("link", { name: "Segundo" }).length,
      ).toBeGreaterThan(0);
    });
    expect(loadMoreTemplates).toHaveBeenCalledWith(filters, 2);
  });
});
