import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

const createTemplate = vi.fn();
const deleteTemplate = vi.fn();
const push = vi.fn();

vi.mock("@/app/(app)/templates/actions", () => ({
  createTemplate: (...args: unknown[]) => createTemplate(...args),
  deleteTemplate: (...args: unknown[]) => deleteTemplate(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

import { TemplateManager } from "./template-manager";

const templates = [
  {
    documentId: "tpl1",
    name: "Montagem padrão",
    code: "MNT-01",
    subTaskCount: 1,
  },
];

describe("TemplateManager", () => {
  it("renders template list with subtask count", () => {
    renderWithIntl(<TemplateManager templates={templates} />);
    expect(screen.getByText("Montagem padrão")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("links each template to its detail page", () => {
    renderWithIntl(<TemplateManager templates={templates} />);
    expect(screen.getByRole("link", { name: "Montagem padrão" })).toHaveAttribute(
      "href",
      "/templates/tasks/tpl1",
    );
  });

  it("shows new template form title", () => {
    renderWithIntl(<TemplateManager templates={[]} />);
    expect(screen.getByRole("heading", { name: "Novo modelo" })).toBeInTheDocument();
  });

  it("creates a template and navigates to the detail page", async () => {
    const user = userEvent.setup();
    createTemplate.mockResolvedValue("tpl-new");

    renderWithIntl(<TemplateManager templates={[]} />);

    await user.type(screen.getByLabelText("Nome"), "Novo modelo");
    await user.type(screen.getByLabelText("Código"), "999");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(createTemplate).toHaveBeenCalledWith({
      name: "Novo modelo",
      code: "999",
    });
    expect(push).toHaveBeenCalledWith("/templates/tasks/tpl-new");
  });
});
