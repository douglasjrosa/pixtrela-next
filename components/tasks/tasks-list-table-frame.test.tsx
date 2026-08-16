import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { TaskListRowPresentational } from "./task-list-row-presentational";
import { TasksListTableFrame } from "./tasks-list-table-frame";

const loadMoreTasks = vi.fn();
const bulkDeactivateTasks = vi.fn();
const bulkDeleteTasks = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/tasks/actions", () => ({
  loadMoreTasks: (...args: unknown[]) => loadMoreTasks(...args),
  bulkDeactivateTasks: (...args: unknown[]) => bulkDeactivateTasks(...args),
  bulkDeleteTasks: (...args: unknown[]) => bulkDeleteTasks(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

const filters = {
  statuses: ["waiting"] as Array<"waiting">,
  from: "2026-06-01",
  to: "2026-07-15",
  column: "deliveryDate" as const,
  direction: "asc" as const,
  showArchived: false,
};

const initialTasks = [
  {
    documentId: "t1",
    name: "Primeira",
    qty: 1,
    index: 0,
    status: "waiting" as const,
    active: true,
    totalExpectedTime: 0,
    totalTimeSpent: 0,
    finishedSubTaskCount: 0,
    totalSubTaskCount: 0,
    deliveryDate: "2026-07-01",
  },
];

const rowLabels = {
  inactive: "Inativa",
  status: "Aguardando",
  spentOfExpected: "0min de 0min",
  finishedSubTasks: "0 de 0",
  qtyShort: "Qtde.: 1",
  selectRow: "Selecionar Primeira",
};

function selectableBody(task = initialTasks[0]) {
  return (
    <tbody>
      <TaskListRowPresentational
        task={task}
        variant="table"
        href={`/tasks/${task.documentId}`}
        labels={rowLabels}
        showCheckboxColumn
      />
    </tbody>
  );
}

describe("TasksListTableFrame", () => {
  beforeEach(() => {
    loadMoreTasks.mockReset();
    bulkDeactivateTasks.mockReset();
    bulkDeleteTasks.mockReset();
    showErrorToast.mockReset();
    showSuccessToast.mockReset();
    replace.mockReset();
    refresh.mockReset();
  });

  it("appends the next page when Carregar mais is clicked", async () => {
    loadMoreTasks.mockResolvedValueOnce({
      tasks: [
        {
          documentId: "t2",
          name: "Segunda",
          qty: 1,
          index: 1,
          status: "waiting",
          active: true,
          totalExpectedTime: 0,
          totalTimeSpent: 0,
          finishedSubTaskCount: 0,
          totalSubTaskCount: 0,
          deliveryDate: "2026-07-02",
        },
      ],
      page: 2,
      pageCount: 2,
      hasMore: false,
    });

    renderWithIntl(
      <TasksListTableFrame
        filters={filters}
        initialTasks={initialTasks}
        initialHasMore
        initialPage={1}
        tableHeader={<thead><tr><th>Nome</th></tr></thead>}
        tableBody={selectableBody()}
        mobileList={
          <ul>
            <li>Primeira</li>
          </ul>
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    await waitFor(() => {
      expect(loadMoreTasks).toHaveBeenCalledWith(filters, 2);
    });
    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Segunda" }).length).toBeGreaterThan(
        0,
      );
    });
    expect(
      screen.queryByRole("button", { name: "Carregar mais" }),
    ).not.toBeInTheDocument();
  });

  it("submits bulk archive when a row is selected", async () => {
    bulkDeactivateTasks.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithIntl(
      <TasksListTableFrame
        filters={filters}
        initialTasks={initialTasks}
        initialHasMore={false}
        initialPage={1}
        canDeactivate
        tableHeader={<thead><tr><th>Nome</th></tr></thead>}
        tableBody={selectableBody()}
        mobileList={null}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: "Arquivar selecionadas" }));
    const reason = "x".repeat(50);
    await user.type(
      screen.getByLabelText("Motivo da desativação"),
      reason,
    );
    await user.click(screen.getByRole("button", { name: "Arquivar" }));

    await waitFor(() => {
      expect(bulkDeactivateTasks).toHaveBeenCalledWith(["t1"], reason);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });

  it("shows delete action when all selected tasks are archived", async () => {
    bulkDeleteTasks.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const archivedTasks = [
      {
        ...initialTasks[0],
        active: false,
      },
    ];

    renderWithIntl(
      <TasksListTableFrame
        filters={filters}
        initialTasks={archivedTasks}
        initialHasMore={false}
        initialPage={1}
        canDelete
        tableHeader={<thead><tr><th>Nome</th></tr></thead>}
        tableBody={selectableBody(archivedTasks[0]!)}
        mobileList={null}
      />,
    );

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: "Excluir selecionadas" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(bulkDeleteTasks).toHaveBeenCalledWith(["t1"]);
    });
    expect(showSuccessToast).toHaveBeenCalled();
  });
});
