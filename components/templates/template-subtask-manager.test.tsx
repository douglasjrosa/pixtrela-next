import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { TemplateSubTaskRow } from "@/lib/business/template-subtask-map";

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
  it("removes a subtask locally without persisting", async () => {
    const user = userEvent.setup();
    const onSubtasksChange = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithIntl(
      <TemplateSubTaskManager
        subtasks={subtasks}
        onSubtasksChange={onSubtasksChange}
      />,
    );

    const removeButtons = screen.getAllByRole("button", { name: "Remover subtarefa" });
    await user.click(removeButtons[0]!);

    expect(onSubtasksChange).toHaveBeenCalledTimes(1);
    const nextRows = onSubtasksChange.mock.calls[0]![0] as TemplateSubTaskRow[];
    expect(nextRows).toHaveLength(1);
    expect(nextRows[0]?.name).toBe("Solda");
  });

  it("adds a draft row when add subtask is clicked", async () => {
    const user = userEvent.setup();
    const onSubtasksChange = vi.fn();

    renderWithIntl(
      <TemplateSubTaskManager
        subtasks={subtasks}
        onSubtasksChange={onSubtasksChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Adicionar subtarefa" }));

    expect(onSubtasksChange).toHaveBeenCalledTimes(1);
    const nextRows = onSubtasksChange.mock.calls[0]![0] as TemplateSubTaskRow[];
    expect(nextRows).toHaveLength(3);
    expect(nextRows[2]?.isDraft).toBe(true);
  });
});
