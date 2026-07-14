import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { SubTaskAssigneePicker } from "./subtask-assignee-picker";

const teams = [
  {
    documentId: "t1",
    name: "Equipe Norte",
    members: [
      { documentId: "u1", name: "Maria" },
      { documentId: "u2", name: "João" },
    ],
  },
  {
    documentId: "t2",
    name: "Equipe Sul",
    members: [{ documentId: "u3", name: "Ana" }],
  },
];

describe("SubTaskAssigneePicker", () => {
  it("renders a card per team with member badges", () => {
    renderWithIntl(
      <SubTaskAssigneePicker
        id="assignees"
        label="Atribuído a"
        teams={teams}
        value={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Equipe Norte")).toBeInTheDocument();
    expect(screen.getByText("Equipe Sul")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atribuir Maria" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atribuir Ana" })).toBeInTheDocument();
  });

  it("toggles assignment when clicking a member badge", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <SubTaskAssigneePicker
        id="assignees"
        label="Atribuído a"
        teams={teams}
        value={["u1"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remover Maria" }));
    expect(onChange).toHaveBeenCalledWith([]);

    await user.click(screen.getByRole("button", { name: "Atribuir João" }));
    expect(onChange).toHaveBeenCalledWith(["u1", "u2"]);
  });

  it("selects all collaborators when TODOS is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <SubTaskAssigneePicker
        id="assignees"
        label="Atribuído a"
        teams={teams}
        value={[]}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar ou desmarcar todos os colaboradores" }),
    );
    expect(onChange).toHaveBeenCalledWith(["u1", "u2", "u3"]);
  });

  it("clears all collaborators when TODOS is clicked and all are selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <SubTaskAssigneePicker
        id="assignees"
        label="Atribuído a"
        teams={teams}
        value={["u1", "u2", "u3"]}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar ou desmarcar todos os colaboradores" }),
    );
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("selects all members of a team when the team title is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <SubTaskAssigneePicker
        id="assignees"
        label="Atribuído a"
        teams={teams}
        value={["u3"]}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar ou desmarcar todos de Equipe Norte" }),
    );
    expect(onChange).toHaveBeenCalledWith(["u3", "u1", "u2"]);
  });

  it("clears all members of a team when the team title is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithIntl(
      <SubTaskAssigneePicker
        id="assignees"
        label="Atribuído a"
        teams={teams}
        value={["u1", "u2", "u3"]}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Marcar ou desmarcar todos de Equipe Norte" }),
    );
    expect(onChange).toHaveBeenCalledWith(["u3"]);
  });

  it("renders compact rows variant without TODOS control", () => {
    renderWithIntl(
      <SubTaskAssigneePicker
        id="assignees-rows"
        teams={teams}
        value={["u1"]}
        variant="rows"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Equipe Norte")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover Maria" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Marcar ou desmarcar todos os colaboradores",
      }),
    ).not.toBeInTheDocument();
  });
});
