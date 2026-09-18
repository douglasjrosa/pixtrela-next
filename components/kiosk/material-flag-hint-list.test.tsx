import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MaterialFlagHintList } from "./material-flag-hint-list";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, values?: { code?: string }) => {
    const kiosk: Record<string, string> = {
      dependencyFlags: "Bandeiras",
      semBandeira: "Sem bandeira",
      semBandeiraMissingCategoryInfo:
        "Esta subtarefa ainda não possui categoria de bandeiras vinculada a ela.",
      releaseFlagConfirmTitle: `Liberar bandeira ${values?.code ?? ""}?`,
      releaseFlags: "Liberar bandeiras",
    };
    const common: Record<string, string> = {
      yes: "Sim",
      cancel: "Cancelar",
    };
    const messages = namespace === "common" ? common : kiosk;
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
    expect(screen.queryByRole("button", { name: "C-3" })).not.toBeInTheDocument();
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

  it("opens confirm modal when badge is pressed while producing", () => {
    const onReleaseFlag = vi.fn();
    render(
      <MaterialFlagHintList
        dependencyFlags={[
          {
            predecessorName: "Corte",
            codes: ["C-10"],
            flags: [{ id: "flag-1", code: "C-10" }],
          },
        ]}
        onReleaseFlag={onReleaseFlag}
        canReleaseFlags
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "C-10" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Liberar bandeira C-10?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sim" }));
    expect(onReleaseFlag).toHaveBeenCalledWith("flag-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes confirm modal on cancel without releasing", () => {
    const onReleaseFlag = vi.fn();
    render(
      <MaterialFlagHintList
        dependencyFlags={[
          {
            predecessorName: "Corte",
            codes: ["C-10"],
            flags: [{ id: "flag-1", code: "C-10" }],
          },
        ]}
        onReleaseFlag={onReleaseFlag}
        canReleaseFlags
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "C-10" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onReleaseFlag).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
