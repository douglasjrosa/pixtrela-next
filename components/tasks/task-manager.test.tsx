import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TaskManager } from "./task-manager";

vi.mock("@/app/(app)/tasks/actions", () => ({
  createTask: vi.fn(),
  deactivateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const steps = [{ documentId: "s1", name: "Fila" }];
const tasks = [
  {
    documentId: "t1",
    name: "Montagem",
    qty: 2,
    index: 0,
    status: "queued" as const,
    active: true,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
    deliveryDate: "2026-06-12",
    step: { documentId: "s1", name: "Fila" },
  },
];

describe("TaskManager", () => {
  it("renders task list with link to detail page", () => {
    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete={false} />,
    );
    const link = screen.getByRole("link", { name: "Montagem" });
    expect(link).toHaveAttribute("href", "/tasks/t1");
    expect(screen.getByText("12/06/2026")).toBeInTheDocument();
  });

  it("shows new task form title", () => {
    renderWithIntl(
      <TaskManager tasks={[]} steps={steps} canDelete={false} />,
    );
    expect(screen.getByRole("heading", { name: "Nova tarefa" })).toBeInTheDocument();
  });

  it("shows delete action when canDelete is true", () => {
    renderWithIntl(
      <TaskManager tasks={tasks} steps={steps} canDelete />,
    );
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });
});
