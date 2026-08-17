import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TeamColaboratorPicker } from "./team-colaborator-picker";

const colaborators = [
  { documentId: "c1", name: "Ana" },
  { documentId: "c2", name: "Bruno" },
];

describe("TeamColaboratorPicker", () => {
  it("renders collaborator badges", () => {
    renderWithIntl(
      <TeamColaboratorPicker
        id="colaborators"
        label="Colaboradores"
        colaborators={colaborators}
        value={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Colaboradores")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Incluir Ana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Incluir Bruno" })).toBeInTheDocument();
  });

  it("toggles selection when clicking a badge", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <TeamColaboratorPicker
        id="colaborators"
        label="Colaboradores"
        colaborators={colaborators}
        value={["c1"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remover Ana" }));
    expect(onChange).toHaveBeenCalledWith([]);

    await user.click(screen.getByRole("button", { name: "Incluir Bruno" }));
    expect(onChange).toHaveBeenCalledWith(["c1", "c2"]);
  });
});
