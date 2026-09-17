import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MaterialFlagHintList } from "./material-flag-hint-list";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      dependencyFlags: "Bandeiras",
      semBandeira: "Sem bandeira",
      semBandeiraMissingCategoryInfo:
        "Esta subtarefa ainda não possui categoria de bandeiras vinculada a ela.",
      releaseFlag: "Liberar",
      releaseFlags: "Liberar bandeiras",
    };
    return messages[key] ?? key;
  },
}));

describe("MaterialFlagHintList", () => {
  it("renders flag code with bold styling and hides release when not producing", () => {
    render(
      <MaterialFlagHintList
        dependencyFlags={[
          {
            predecessorName: "Corte",
            codes: ["C-3"],
            flags: [{ id: "flag-1", code: "C-3" }],
          },
        ]}
        onReleaseFlag={vi.fn()}
        canReleaseFlags={false}
      />,
    );

    expect(screen.getByText("C-3")).toHaveClass("font-bold");
    expect(screen.queryByRole("button", { name: "Liberar" })).not.toBeInTheDocument();
  });

  it("shows info icon when predecessor has no flag category", () => {
    render(
      <MaterialFlagHintList
        dependencyFlags={[
          {
            predecessorName: "Corte",
            codes: [],
            semBandeira: true,
            missingCategory: true,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Esta subtarefa ainda não possui categoria de bandeiras vinculada a ela.",
      }),
    ).toBeInTheDocument();
  });

  it("shows release action only when producing", () => {
    render(
      <MaterialFlagHintList
        dependencyFlags={[
          {
            predecessorName: "Corte",
            codes: ["C-3"],
            flags: [{ id: "flag-1", code: "C-3" }],
          },
        ]}
        onReleaseFlag={vi.fn()}
        canReleaseFlags
      />,
    );

    expect(screen.getByRole("button", { name: "Liberar" })).toBeInTheDocument();
  });
});
