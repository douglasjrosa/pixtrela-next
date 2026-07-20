import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { KanbanMultiAssignToolbar } from "./kanban-multi-assign-toolbar";

describe("KanbanMultiAssignToolbar", () => {
  it("hides assign/remove until multi is enabled", () => {
    renderWithIntl(
      <KanbanMultiAssignToolbar
        multiEnabled={false}
        canApply={false}
        onMultiEnabledChange={vi.fn()}
        onAssign={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch", { name: "Multi-seleção" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Atribuir subtarefas" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remover atribuições" }),
    ).not.toBeInTheDocument();
  });

  it("disables actions until canApply is true", () => {
    renderWithIntl(
      <KanbanMultiAssignToolbar
        multiEnabled
        canApply={false}
        onMultiEnabledChange={vi.fn()}
        onAssign={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Atribuir subtarefas" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remover atribuições" }),
    ).toBeDisabled();
  });

  it("calls onAssign and onRemove when enabled", () => {
    const onAssign = vi.fn();
    const onRemove = vi.fn();

    renderWithIntl(
      <KanbanMultiAssignToolbar
        multiEnabled
        canApply
        onMultiEnabledChange={vi.fn()}
        onAssign={onAssign}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Atribuir subtarefas" }));
    fireEvent.click(screen.getByRole("button", { name: "Remover atribuições" }));

    expect(onAssign).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
