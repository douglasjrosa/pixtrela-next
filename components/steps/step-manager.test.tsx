import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { StepManager } from "./step-manager";

const steps = [{ documentId: "s1", name: "Fila", index: 0 }];

describe("StepManager", () => {
  it("renders step list", () => {
    renderWithIntl(
      <StepManager
        steps={steps}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
      />,
    );
    expect(screen.getByText("Fila")).toBeInTheDocument();
  });

  it("shows new step form title", () => {
    renderWithIntl(
      <StepManager
        steps={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete={false}
      />,
    );
    expect(screen.getByRole("heading", { name: "Nova etapa" })).toBeInTheDocument();
  });

  it("shows delete action when canDelete is true", () => {
    renderWithIntl(
      <StepManager
        steps={steps}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete
      />,
    );
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });
});
