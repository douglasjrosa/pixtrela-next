import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { LIST_SEARCH_DEBOUNCE_MS } from "@/lib/ui/list-url";

import { ListNameSearch } from "./list-name-search";

const replace = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

function parseFilters(params: Record<string, string | string[] | undefined>) {
  const raw = params.q;
  const q = Array.isArray(raw) ? raw[0] : raw;
  return { q: q?.trim() || undefined };
}

function serializeFilters(filters: { q?: string }): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  return params;
}

describe("ListNameSearch", () => {
  beforeEach(() => {
    replace.mockReset();
    Array.from(searchParams.keys()).forEach((key) => searchParams.delete(key));
  });

  it("updates URL after debounce when query has at least minChars", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ListNameSearch
        pathname="/tasks"
        parseFilters={parseFilters}
        serializeFilters={serializeFilters}
        minChars={3}
        label="Buscar por nome"
      />,
    );

    await user.type(screen.getByLabelText("Buscar por nome"), "mon");

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith("/tasks?q=mon");
      },
      { timeout: LIST_SEARCH_DEBOUNCE_MS + 500 },
    );
  });

  it("does not push short queries as q", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ListNameSearch
        pathname="/tasks"
        parseFilters={parseFilters}
        serializeFilters={serializeFilters}
        minChars={3}
        label="Buscar por nome"
      />,
    );

    await user.type(screen.getByLabelText("Buscar por nome"), "mo");

    await new Promise((resolve) =>
      setTimeout(resolve, LIST_SEARCH_DEBOUNCE_MS + 50),
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("supports a controlled search without touching the URL", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithIntl(
      <ListNameSearch
        label="Buscar por nome"
        value=""
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText("Buscar por nome"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
    expect(replace).not.toHaveBeenCalled();
  });
});
