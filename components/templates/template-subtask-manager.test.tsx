import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { TemplateSubTaskRow } from "@/lib/business/template-subtask-map";

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: vi.fn(async () => []),
}));

import {
  resolveTemplateSubTaskReorder,
  TemplateSubTaskManager,
} from "./template-subtask-manager";

const subtasks: TemplateSubTaskRow[] = [
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
  {
    rowKey: "row-1",
    name: "Solda",
    qty: 2,
    index: 1,
    expectedTime: 120,
    sharingType: "duration",
    maxSameTimeWorkers: 1,
    dependencyIndexes: [0],
  },
];

describe("resolveTemplateSubTaskReorder", () => {
  it("reorders rows and reassigns indexes", () => {
    const next = resolveTemplateSubTaskReorder(subtasks, "row-0", "row-1");
    expect(next?.map((row) => row.rowKey)).toEqual(["row-1", "row-0"]);
    expect(next?.map((row) => row.index)).toEqual([0, 1]);
  });
});

describe("TemplateSubTaskManager", () => {
  it("opens edit modal when a row is clicked", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <TemplateSubTaskManager
        subtasks={subtasks}
        templateName="Modelo A"
        onSubtasksChange={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Corte"));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Editar subtarefa" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Modelo A")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Clonar subtarefa" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Remover subtarefa" }),
    ).toBeInTheDocument();
  });

  it("does not show clone/remove controls on the table rows", () => {
    renderWithIntl(
      <TemplateSubTaskManager
        subtasks={subtasks}
        templateName="Modelo A"
        onSubtasksChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Remover subtarefa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clonar subtarefa" }),
    ).not.toBeInTheDocument();
  });

  it("opens create modal without inserting a row until confirmed", async () => {
    const user = userEvent.setup();
    const onSubtasksChange = vi.fn();

    renderWithIntl(
      <TemplateSubTaskManager
        subtasks={subtasks}
        templateName="Modelo A"
        onSubtasksChange={onSubtasksChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Nova subtarefa" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova subtarefa" }),
    ).toBeInTheDocument();
    expect(onSubtasksChange).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Nome"), "Acabamento");
    await user.click(within(dialog).getByRole("button", { name: "OK" }));

    expect(onSubtasksChange).toHaveBeenCalledTimes(1);
    const nextRows = onSubtasksChange.mock.calls[0]![0] as TemplateSubTaskRow[];
    expect(nextRows).toHaveLength(3);
    expect(nextRows[2]?.name).toBe("Acabamento");
    expect(nextRows[2]?.isDraft).toBe(true);
  });

  it("removes a subtask from the modal without persisting remotely", async () => {
    const user = userEvent.setup();
    const onSubtasksChange = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithIntl(
      <TemplateSubTaskManager
        subtasks={subtasks}
        templateName="Modelo A"
        onSubtasksChange={onSubtasksChange}
      />,
    );

    await user.click(screen.getByText("Corte"));
    await user.click(
      screen.getByRole("button", { name: "Remover subtarefa" }),
    );

    expect(onSubtasksChange).toHaveBeenCalledTimes(1);
    const nextRows = onSubtasksChange.mock.calls[0]![0] as TemplateSubTaskRow[];
    expect(nextRows).toHaveLength(1);
    expect(nextRows[0]?.name).toBe("Solda");
  });
});
