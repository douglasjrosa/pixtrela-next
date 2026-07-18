import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { TemplatesPageHeader } from "./templates-page-header";
import { TemplatesListView } from "./templates-list-view";

const createTemplate = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/templates/actions", () => ({
  createTemplate: (...args: unknown[]) => createTemplate(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

const templates = [
  {
    documentId: "tpl1",
    name: "Montagem padrão",
    code: "MNT-01",
    subTaskCount: 1,
  },
];

describe("TemplatesPageHeader", () => {
  beforeEach(() => {
    createTemplate.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
    createTemplate.mockResolvedValue("tpl-new");
  });

  it("opens create modal when Novo modelo is clicked", () => {
    renderWithIntl(<TemplatesPageHeader />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo modelo" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Novo modelo" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("creates a template and refreshes the list", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TemplatesPageHeader />);

    await user.click(screen.getByRole("button", { name: "Novo modelo" }));
    await user.type(screen.getByLabelText("Nome"), "Novo modelo");
    await user.type(screen.getByLabelText("Código"), "999");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(createTemplate).toHaveBeenCalledWith({
        name: "Novo modelo",
        code: "999",
      });
    });
    expect(showSuccessToast).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});

describe("TemplatesListView", () => {
  it("renders template list with subtask count", () => {
    renderWithIntl(<TemplatesListView templates={templates} />);
    expect(screen.getAllByText("Montagem padrão").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("shows empty state when there are no templates", () => {
    renderWithIntl(<TemplatesListView templates={[]} />);
    expect(screen.getByText("Nenhum modelo encontrado.")).toBeInTheDocument();
  });
});
