import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TaskEditor } from "./task-editor";

const steps = [{ documentId: "s1", name: "Fila" }];
const task = {
  documentId: "t1",
  name: "Montagem",
  qty: 2,
  index: 0,
  status: "queued" as const,
  active: true,
  totalExpectedTime: 120,
  totalTimeSpent: 60,
  step: { documentId: "s1", name: "Fila" },
};

describe("TaskEditor", () => {
  it("renders task edit form with task name prefilled", () => {
    renderWithIntl(
      <TaskEditor task={task} steps={steps} onUpdate={vi.fn()} />,
    );

    expect(screen.getByDisplayValue("Montagem")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Editar tarefa" }),
    ).toBeInTheDocument();
  });
});
