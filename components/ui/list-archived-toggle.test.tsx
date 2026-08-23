import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { ListArchivedToggle } from "./list-archived-toggle";

const replace = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

function parseFilters(params: Record<string, string | string[] | undefined>) {
  const raw = params.archived;
  const archived = Array.isArray(raw) ? raw[0] : raw;
  return { showArchived: archived === "1" };
}

function serializeFilters(filters: { showArchived: boolean }): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.showArchived) params.set("archived", "1");
  return params;
}

describe("ListArchivedToggle", () => {
  beforeEach(() => {
    replace.mockReset();
    Array.from(searchParams.keys()).forEach((key) => searchParams.delete(key));
  });

  it("writes archived=1 to the list URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ListArchivedToggle
        pathname="/templates/tasks"
        parseFilters={parseFilters}
        serializeFilters={serializeFilters}
        label="Exibir modelos arquivados"
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Exibir modelos arquivados" }),
    );
    expect(replace).toHaveBeenCalledWith("/templates/tasks?archived=1");
  });

  it("supports a controlled checkbox without touching the URL", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <ListArchivedToggle
        label="Exibir moedas arquivadas"
        checked={false}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Exibir moedas arquivadas" }),
    );
    expect(onChange).toHaveBeenCalledWith(true);
    expect(replace).not.toHaveBeenCalled();
  });
});
