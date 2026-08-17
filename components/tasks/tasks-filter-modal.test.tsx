import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { defaultTaskListFilters } from "@/lib/tasks/task-list-params";

import { TasksFilterModal } from "./tasks-filter-modal";

const replace = vi.fn();
const showErrorToast = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: vi.fn(),
}));

const FIXED_NOW = new Date(2026, 6, 15);

describe("TasksFilterModal", () => {
  beforeEach(() => {
    replace.mockReset();
    showErrorToast.mockReset();
  });

  it("keeps finished unchecked by default and applies filters to URL", async () => {
    const user = userEvent.setup();
    const filters = defaultTaskListFilters(FIXED_NOW);
    const onClose = vi.fn();

    renderWithIntl(
      <TasksFilterModal
        open
        initialFilters={filters}
        onClose={onClose}
      />,
    );

    const finished = screen.getByRole("checkbox", { name: "Finalizada" });
    expect(finished).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Aguardando" })).toBeChecked();

    await user.click(finished);
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("status="),
    );
    expect(replace.mock.calls[0]?.[0]).toContain("finished");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes without navigating when Fechar is clicked", () => {
    const onClose = vi.fn();
    renderWithIntl(
      <TasksFilterModal
        open
        initialFilters={defaultTaskListFilters(FIXED_NOW)}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("clears filters back to defaults", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <TasksFilterModal
        open
        initialFilters={{
          statuses: ["finished"],
          from: "2026-01-01",
          to: "2026-02-01",
          q: "abc",
          column: "deliveryDate",
          direction: "asc",
          showArchived: true,
        }}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Limpar" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/tasks");
    });
  });

  it("shows archived checkbox unchecked by default", () => {
    renderWithIntl(
      <TasksFilterModal
        open
        initialFilters={defaultTaskListFilters(FIXED_NOW)}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Exibir tarefas arquivadas" }),
    ).not.toBeChecked();
  });

  it("defaults the to date to today in pt-BR format", () => {
    renderWithIntl(
      <TasksFilterModal
        open
        initialFilters={defaultTaskListFilters(FIXED_NOW)}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Até")).toHaveValue("15/07/2026");
  });

  it("blocks apply when the date range exceeds three months", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <TasksFilterModal
        open
        initialFilters={{
          ...defaultTaskListFilters(FIXED_NOW),
          from: "2026-01-01",
          to: "2026-07-15",
        }}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(showErrorToast).toHaveBeenCalledWith(
      "O intervalo entre De e Até não pode ser maior que 3 meses.",
    );
    expect(replace).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
