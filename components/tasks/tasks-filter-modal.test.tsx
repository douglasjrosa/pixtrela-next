import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { defaultTaskListFilters } from "@/lib/tasks/task-list-params";

import { TasksFilterModal } from "./tasks-filter-modal";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const FIXED_NOW = new Date(2026, 6, 15);

describe("TasksFilterModal", () => {
  beforeEach(() => {
    replace.mockReset();
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
        }}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Limpar" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/tasks");
    });
  });
});
