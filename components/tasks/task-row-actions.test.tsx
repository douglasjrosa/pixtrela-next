import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TaskRowActions } from "./task-row-actions";

describe("TaskRowActions", () => {
  it("shows deactivate for active tasks", () => {
    renderWithIntl(
      <TaskRowActions
        documentId="abc"
        active
        canDelete={false}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Desativar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("shows delete only when canDelete is true", () => {
    renderWithIntl(
      <TaskRowActions
        documentId="abc"
        active={false}
        canDelete
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.queryByRole("button", { name: "Desativar" })).not.toBeInTheDocument();
  });
});
