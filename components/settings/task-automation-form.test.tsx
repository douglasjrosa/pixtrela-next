import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TaskAutomationForm } from "./task-automation-form";

const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

const steps = [
  { documentId: "step-1", name: "Fila de produção" },
  { documentId: "step-2", name: "Produzindo" },
];

const defaultValues = {
  waitingStepDocumentId: "step-1",
  producingStepDocumentId: "step-2",
  pausedStepDocumentId: "",
  finishedStepDocumentId: "",
};

describe("TaskAutomationForm", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
  });

  it("renders a step select for each task status", () => {
    renderWithIntl(
      <TaskAutomationForm
        steps={steps}
        defaultValues={defaultValues}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Etapas" })).toBeInTheDocument();
    expect(screen.getByLabelText("Aguardando =>")).toHaveValue("step-1");
    expect(screen.getByLabelText("Produzindo =>")).toHaveValue("step-2");
    expect(screen.getByLabelText("Pausada =>")).toHaveValue("");
    expect(screen.getByLabelText("Finalizada =>")).toHaveValue("");
  });

  it("calls onSave with updated mappings", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TaskAutomationForm
        steps={steps}
        defaultValues={defaultValues}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Pausada =>"), {
      target: { value: "step-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        waitingStepDocumentId: "step-1",
        producingStepDocumentId: "step-2",
        pausedStepDocumentId: "step-1",
        finishedStepDocumentId: "",
      });
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Configurações salvas.");
  });
});
