import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
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
});
