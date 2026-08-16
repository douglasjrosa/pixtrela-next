import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { TemplateListRowPresentational } from "./template-list-row-presentational";
import { TemplatesListTableFrame } from "./templates-list-table-frame";

const loadMoreTemplates = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/templates/actions", () => ({
  loadMoreTemplates: (...args: unknown[]) => loadMoreTemplates(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

const filters = {
  column: "name" as const,
  direction: "asc" as const,
};

const initialTemplates = [
  {
    documentId: "tpl1",
    name: "Primeiro",
    code: "1",
    subTaskCount: 0,
  },
];

describe("TemplatesListTableFrame", () => {
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
      <TemplatesListTableFrame
        filters={filters}
        initialTemplates={initialTemplates}
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
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreTemplates).toHaveBeenCalledWith(filters, 2);
    });
    await waitFor(() => {
      expect(
        screen.getAllByRole("link", { name: "Segundo" }).length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.queryByRole("button", { name: "Carregar mais" }),
    ).not.toBeInTheDocument();
  });

  it("centers the load more button", () => {
    renderWithIntl(
      <TemplatesListTableFrame
        filters={filters}
        initialTemplates={initialTemplates}
        initialHasMore
        initialPage={1}
        tableHeader={null}
        tableBody={null}
        mobileList={null}
      />,
    );

    const button = screen.getByRole("button", { name: "Carregar mais" });
    expect(button.parentElement).toHaveClass("justify-center");
  });
});

describe("TemplateListRowPresentational", () => {
  it("links the name to the template detail", () => {
    renderWithIntl(
      <table>
        <tbody>
          <TemplateListRowPresentational
            template={initialTemplates[0]!}
            variant="table"
            href="/templates/tasks/tpl1"
            labels={{ subTaskCountShort: "0 subtarefa(s)" }}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByRole("link", { name: "Primeiro" })).toHaveAttribute(
      "href",
      "/templates/tasks/tpl1",
    );
  });
});
