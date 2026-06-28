import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

const loadTemplateFromLegacy = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/app/(app)/templates/actions", () => ({
  loadTemplateFromLegacy: (...args: unknown[]) => loadTemplateFromLegacy(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

import { TemplateManager } from "./template-manager";

const templates = [
  {
    documentId: "tpl1",
    name: "Montagem padrão",
    code: "MNT-01",
    subTask: [
      {
        name: "Soldar",
        qty: 1,
        sharingType: "duration" as const,
        maxSameTimeWorkers: 1,
        index: 0,
        expectedTime: 60,
        dependencies: null,
      },
    ],
  },
];

describe("TemplateManager", () => {
  it("renders template list with subtask count", () => {
    renderWithIntl(
      <TemplateManager
        templates={templates}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
      />,
    );
    expect(screen.getByText("Montagem padrão")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows embedded subtask fields after add", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <TemplateManager
        templates={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
      />,
    );
    expect(screen.getByText("Adicionar subtarefa")).toBeInTheDocument();
    await user.click(screen.getByText("Adicionar subtarefa"));
    expect(screen.getByLabelText("Tipo de compartilhamento")).toBeInTheDocument();
  });

  it("shows new template form title", () => {
    renderWithIntl(
      <TemplateManager
        templates={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
      />,
    );
    expect(screen.getByRole("heading", { name: "Novo modelo" })).toBeInTheDocument();
  });

  it("warns when loading a template without a code", async () => {
    const user = userEvent.setup();
    loadTemplateFromLegacy.mockReset();
    showErrorToast.mockReset();
    renderWithIntl(
      <TemplateManager
        templates={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Carregar template" }));
    expect(loadTemplateFromLegacy).not.toHaveBeenCalled();
    expect(showErrorToast).toHaveBeenCalledWith(
      "Informe o Código (id da caixa) antes de carregar.",
    );
  });

  it("loads the template from the legacy system and fills the form", async () => {
    const user = userEvent.setup();
    loadTemplateFromLegacy.mockReset();
    showSuccessToast.mockReset();
    loadTemplateFromLegacy.mockResolvedValue({
      name: "Max Brasil - Caixa teste",
      code: "123",
      subTask: [
        {
          name: "Corte dos pés da base",
          qty: 1,
          sharingType: "duration",
          maxSameTimeWorkers: 1,
          index: 0,
          expectedTime: 60,
          dependencies: null,
        },
      ],
    });

    renderWithIntl(
      <TemplateManager
        templates={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
      />,
    );

    await user.type(screen.getByLabelText("Código"), "123");
    await user.click(screen.getByRole("button", { name: "Carregar template" }));

    await waitFor(() =>
      expect(loadTemplateFromLegacy).toHaveBeenCalledWith("123"),
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue("Max Brasil - Caixa teste")).toBeInTheDocument(),
    );
    expect(showSuccessToast).toHaveBeenCalledWith(
      "Template carregado. Revise e salve.",
    );
  });
});
