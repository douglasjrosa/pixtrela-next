import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/pt-BR.json";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("@/app/(app)/sub-task-presets/actions", () => ({
  searchSubTaskPresets: vi.fn(async () => []),
}));

import {
  resolveSubTaskReorder,
  SubTaskManager,
  type SubTaskManagerHandle,
} from "./subtask-manager";

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
        taskName="Tarefa A"
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
        taskName="Tarefa A"
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
        taskName="Tarefa A"
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

  it("does not show clone or remove buttons on table rows", () => {
    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const table = screen.getByRole("table");
    expect(
      within(table).queryByRole("button", { name: "Clonar subtarefa" }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole("button", { name: "Remover subtarefa" }),
    ).not.toBeInTheDocument();
  });

  it("opens the subtask form modal when clicking a row", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskName="Tarefa A"
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
      within(dialog).getByRole("heading", { name: "Editar subtarefa" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("1 - Tarefa A")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Clonar subtarefa" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Remover subtarefa" }),
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
        taskName="Tarefa A"
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
      within(dialog).queryByRole("button", { name: "Clonar subtarefa" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Remover subtarefa" }),
    ).not.toBeInTheDocument();
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
        taskName="Tarefa A"
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
        taskName="Tarefa A"
        taskQty={10}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("inserts a local draft clone after the source row from the modal", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const managerRef = createRef<SubTaskManagerHandle>();

    renderWithIntl(
      <SubTaskManager
        ref={managerRef}
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Pintar"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clonar subtarefa",
      }),
    );

    expect(screen.getByText("Pintar - CÓPIA")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Nova subtarefa" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Pintar - CÓPIA")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Clonar subtarefa" }),
    ).toBeInTheDocument();

    const table = screen.getByRole("table");
    const bodyRows = within(table).getAllByRole("row").slice(1);
    expect(
      within(bodyRows[1] as HTMLElement).getByText("Pintar"),
    ).toBeInTheDocument();
    expect(
      within(bodyRows[2] as HTMLElement).getByText("Pintar - CÓPIA"),
    ).toBeInTheDocument();

    await managerRef.current?.flushChanges();
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Pintar - CÓPIA" }),
      expect.objectContaining({ insertAtIndex: expect.any(Number) }),
    );
  });

  it("creates a clone draft exactly once even if flushChanges runs twice", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const managerRef = createRef<SubTaskManagerHandle>();

    renderWithIntl(
      <SubTaskManager
        ref={managerRef}
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Pintar"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clonar subtarefa",
      }),
    );

    await managerRef.current?.flushChanges();
    await managerRef.current?.flushChanges();

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Pintar - CÓPIA" }),
      expect.objectContaining({ insertAtIndex: expect.any(Number) }),
    );
  });

  it("does not remount a flushed clone draft when server props refresh", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const managerRef = createRef<SubTaskManagerHandle>();
    const persistedClone = {
      ...subtasks[1],
      documentId: "st-clone-1",
      name: "Pintar - CÓPIA",
      index: 2,
      timeSpent: 0,
    };
    const afterSaveSubtasks = [
      subtasks[0],
      subtasks[1],
      persistedClone,
    ];

    const view = renderWithIntl(
      <SubTaskManager
        ref={managerRef}
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Pintar"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clonar subtarefa",
      }),
    );

    await managerRef.current?.flushChanges();
    expect(onCreate).toHaveBeenCalledTimes(1);

    view.rerender(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <SubTaskManager
          ref={managerRef}
          subtasks={afterSaveSubtasks}
          taskName="Tarefa A"
          taskQty={1}
          teams={teams}
          onCreate={onCreate}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getAllByText("Pintar - CÓPIA")).toHaveLength(1);

    await managerRef.current?.flushChanges();
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("removes a persisted subtask locally and deletes only on flushChanges", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onDelete = vi.fn();
    const managerRef = createRef<SubTaskManagerHandle>();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithIntl(
      <SubTaskManager
        ref={managerRef}
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByText("Soldar"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Remover subtarefa",
      }),
    );

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Soldar")).not.toBeInTheDocument();
    expect(screen.getByText("Pintar")).toBeInTheDocument();

    await managerRef.current?.flushChanges();
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("st1");
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("does not call onDelete when removing a draft clone", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const managerRef = createRef<SubTaskManagerHandle>();

    renderWithIntl(
      <SubTaskManager
        ref={managerRef}
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByText("Pintar"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clonar subtarefa",
      }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Remover subtarefa",
      }),
    );

    await managerRef.current?.flushChanges();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("clones a draft copy to create a copy of the copy from the modal", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Pintar"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clonar subtarefa",
      }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clonar subtarefa",
      }),
    );

    expect(screen.getByDisplayValue("Pintar - CÓPIA - CÓPIA")).toBeInTheDocument();
  });

  it("closes the modal after removing a draft clone", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskName="Tarefa A"
        taskQty={1}
        teams={teams}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Pintar"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Clonar subtarefa",
      }),
    );
    expect(screen.getByDisplayValue("Pintar - CÓPIA")).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Remover subtarefa",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Pintar - CÓPIA")).not.toBeInTheDocument();
  });

  it("does not show save button inside the subtask form modal", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskName="Tarefa A"
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
      within(dialog).getByRole("heading", { name: "Editar subtarefa" }),
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
        taskName="Tarefa A"
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

  it("closes the form modal when clicking the OK button", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SubTaskManager
        subtasks={subtasks}
        taskName="Tarefa A"
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

    await user.click(within(dialog).getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
