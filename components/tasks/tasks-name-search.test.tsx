import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TASK_LIST_SEARCH_DEBOUNCE_MS } from "@/lib/schemas/task-list-filters";

import { TasksNameSearch } from "./tasks-name-search";

const replace = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

describe("TasksNameSearch", () => {
  beforeEach(() => {
    replace.mockReset();
    Array.from(searchParams.keys()).forEach((key) => searchParams.delete(key));
  });

  it("updates URL after debounce when query has at least 3 chars", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TasksNameSearch />);

    await user.type(screen.getByLabelText("Buscar por nome"), "mon");

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith("/tasks?q=mon");
      },
      { timeout: TASK_LIST_SEARCH_DEBOUNCE_MS + 500 },
    );
  });

  it("does not push short queries as q", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TasksNameSearch />);

    await user.type(screen.getByLabelText("Buscar por nome"), "mo");

    await new Promise((resolve) =>
      setTimeout(resolve, TASK_LIST_SEARCH_DEBOUNCE_MS + 50),
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
