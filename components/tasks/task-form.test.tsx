import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TaskForm } from "./task-form";

const steps = [{ documentId: "s1", name: "Fila" }];
const defaultValues = {
  name: "Montagem",
  qty: 2,
  deliveryDate: "",
  stepDocumentId: "s1",
  status: "queued" as const,
  templateTaskCode: "",
};

describe("TaskForm", () => {
  it("shows edit title and metrics in edit mode", () => {
    renderWithIntl(
      <TaskForm
        mode="edit"
        defaultValues={defaultValues}
        steps={steps}
        metrics={{
          totalExpectedTime: 120,
          totalTimeSpent: 60,
          startedAt: null,
          endedAt: null,
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Editar tarefa" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tempo previsto total/)).toBeInTheDocument();
  });

  it("does not show order input in the form", () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Ordem")).not.toBeInTheDocument();
  });

  it("shows create title in create mode", () => {
    renderWithIntl(
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        steps={steps}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nova tarefa" }),
    ).toBeInTheDocument();
  });
});
