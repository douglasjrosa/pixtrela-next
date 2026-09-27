import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/test-utils";

import { TemplatesPageActionsProvider } from "./templates-page-actions-context";
import { TemplatesToolbar } from "./templates-toolbar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/templates/tasks",
}));

vi.mock("@/app/(app)/templates/template-task-actions", () => ({
  createTemplate: vi.fn(),
}));

describe("TemplatesToolbar", () => {
  it("opens the archived checkbox inside the filter modal", () => {
    renderWithIntl(
      <TemplatesPageActionsProvider>
        <TemplatesToolbar />
      </TemplatesPageActionsProvider>,
    );

    expect(
      screen.queryByRole("checkbox", { name: "Exibir modelos arquivados" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

    expect(
      screen.getByRole("checkbox", { name: "Exibir modelos arquivados" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
