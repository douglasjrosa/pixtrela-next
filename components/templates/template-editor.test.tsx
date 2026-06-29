import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { TemplateSubTaskRow } from "@/lib/business/template-subtask-map";

const updateTemplate = vi.fn();
const loadTemplateFromLegacy = vi.fn();

vi.mock("@/app/(app)/templates/actions", () => ({
  updateTemplate: (...args: unknown[]) => updateTemplate(...args),
  loadTemplateFromLegacy: (...args: unknown[]) => loadTemplateFromLegacy(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

import { TemplateEditor } from "./template-editor";

const initialSubtasks: TemplateSubTaskRow[] = [
  {
    rowKey: "row-0",
    name: "Corte",
    qty: 1,
    index: 0,
    expectedTime: 60,
    sharingType: "duration",
    maxSameTimeWorkers: 1,
    dependencyIndexes: [],
  },
];

describe("TemplateEditor", () => {
  it("persists metadata and subtasks when save is clicked", async () => {
    const user = userEvent.setup();
    updateTemplate.mockResolvedValue(undefined);

    renderWithIntl(
      <TemplateEditor
        documentId="tpl-1"
        template={{ name: "Modelo A", code: "100" }}
        initialSubtasks={initialSubtasks}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(updateTemplate).toHaveBeenCalledWith("tpl-1", {
      name: "Modelo A",
      code: "100",
      subTask: [
        {
          name: "Corte",
          qty: 1,
          sharingType: "duration",
          maxSameTimeWorkers: 1,
          index: 0,
          expectedTime: 60,
          dependencies: null,
        },
      ],
    });
  });
});
