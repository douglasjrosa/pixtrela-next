import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { createGetTranslationsMock } from "@/test/mock-next-intl-server";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next-intl/server", () => ({
  getTranslations: createGetTranslationsMock(),
}));

import { TaskAutomationForm } from "./task-automation-form";

const steps = [
  { documentId: "step-1", name: "Fila de produção" },
  { documentId: "step-2", name: "Produzindo" },
];

const defaultValues = {
  waitingStepDocumentId: "step-1",
  producingStepDocumentId: "step-2",
  pausedStepDocumentId: "",
  finishedStepDocumentId: "",
  reviewedStepDocumentId: "",
  deliveredStepDocumentId: "",
  assignWarnMax: 4,
};

describe("TaskAutomationForm", () => {
  it("renders a step select for each task status", async () => {
    renderWithIntl(
      await TaskAutomationForm({
        steps,
        defaultValues,
        action: vi.fn(),
      }),
    );

    expect(screen.getByRole("heading", { name: "Etapas" })).toBeInTheDocument();
    expect(screen.getByLabelText("Status Aguardando vai para:")).toHaveValue(
      "step-1",
    );
    expect(screen.getByLabelText("Status Produzindo vai para:")).toHaveValue(
      "step-2",
    );
    expect(screen.getByLabelText("Status Pausada vai para:")).toHaveValue("");
    expect(screen.getByLabelText("Status Finalizada vai para:")).toHaveValue(
      "",
    );
    expect(screen.getByLabelText("Status Revisada vai para:")).toHaveValue("");
    expect(screen.getByLabelText("Status Entregue vai para:")).toHaveValue("");
  });
});
