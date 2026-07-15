import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: vi.fn(async () => []),
}));

import { resolveSubTaskReorder, SubTaskManager } from "./subtask-manager";

const teams = [
  {
    documentId: "t1",
    name: "Equipe A",
    members: [{ documentId: "u1", name: "Maria" }],
  },
];

const subtasks = [
  {
    documentId: "st1",
    name: "Soldar",
    qty: 2,
    index: 0,
    expectedTime: 120,
    timeSpent: 0,
    sharingType: "duration" as const,
    maxSameTimeWorkers: 1,
    status: "waiting" as const,
    assignedToIds: ["u1"],
  },
  {
    documentId: "st2",
    name: "Pintar",
    qty: 1,
    index: 1,
    expectedTime: 60,
    timeSpent: 0,
    sharingType: "duration" as const,
    maxSameTimeWorkers: 1,
    status: "waiting" as const,
  },
];

describe("resolveSubTaskReorder", () => {
  it("moves subtasks when drag ends on another row", () => {
    const next = resolveSubTaskReorder(subtasks, "st1", "st2");
    expect(next?.map((item) => item.documentId)).toEqual(["st2", "st1"]);
  });

  it("reassigns sequential indexes on affected rows", () => {
    const next = resolveSubTaskReorder(subtasks, "st1", "st2");
    expect(next?.map((item) => item.index)).toEqual([0, 1]);
    expect(next?.[1]?.documentId).toBe("st1");
  });
});

describe("SubTaskManager", () => {
  it("renders subtask list with expected time", () => {
    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Soldar")).toBeInTheDocument();
    expect(screen.getByText("2min")).toBeInTheDocument();
  });

  it("does not show a position column and keeps row order", () => {
    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText("#")).not.toBeInTheDocument();

    const table = screen.getByRole("table");
    const bodyRows = within(table).getAllByRole("row").slice(1);
    expect(within(bodyRows[0] as HTMLElement).getByText("Soldar")).toBeInTheDocument();
    expect(within(bodyRows[1] as HTMLElement).getByText("Pintar")).toBeInTheDocument();
  });

  it("does not show a static subtask form by default", () => {
    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ordem")).not.toBeInTheDocument();
  });

  it("opens the subtask form modal when clicking a row", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Soldar"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Editar" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText("Atribuído a"),
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Maria")).not.toBeInTheDocument();
  });

  it("shows new subtask form modal when clicking the new button", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={[]}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Nova subtarefa" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova subtarefa" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText("Atribuído a"),
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Status")).not.toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText("Status de ativação"),
    ).not.toBeInTheDocument();
  });

  it("hides status fields when editing an existing subtask", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Soldar"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByLabelText("Status")).not.toBeInTheDocument();
    expect(
      within(dialog).queryByLabelText("Status de ativação"),
    ).not.toBeInTheDocument();
  });

  it("shows total qty as sub-task qty times task qty", () => {
    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={10}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("inserts a local draft clone after the source row", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(
      screen.getAllByRole("button", { name: "Clonar subtarefa" })[1],
    );

    expect(screen.getByText("Pintar - CÓPIA")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova subtarefa" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Pintar - CÓPIA")).toBeInTheDocument();

    const table = screen.getByRole("table");
    const bodyRows = within(table).getAllByRole("row").slice(1);
    expect(
      within(bodyRows[1] as HTMLElement).getByText("Pintar"),
    ).toBeInTheDocument();
    expect(
      within(bodyRows[2] as HTMLElement).getByText("Pintar - CÓPIA"),
    ).toBeInTheDocument();
  });

  it("clones a draft copy to create a copy of the copy", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const cloneButtons = () =>
      screen.getAllByRole("button", { name: "Clonar subtarefa" });

    await user.click(cloneButtons()[1]);
    await user.click(cloneButtons()[2]);

    expect(screen.getByDisplayValue("Pintar - CÓPIA - CÓPIA")).toBeInTheDocument();
  });

  it("does not show save button inside the subtask form modal", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Soldar"));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Editar" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Salvar" }),
    ).not.toBeInTheDocument();
  });

  it("closes the form modal when clicking the close button", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Soldar"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
