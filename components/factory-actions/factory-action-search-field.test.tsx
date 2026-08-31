import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { FactoryActionSearchField } from "./factory-action-search-field";
import type { FactoryAction } from "@/lib/business/factory-action";

const searchFactoryActions = vi.hoisted(() => vi.fn());

vi.mock("@/app/(app)/factory-actions/actions", () => ({
  searchFactoryActions: (...args: unknown[]) => searchFactoryActions(...args),
}));

const grampear: FactoryAction = {
  documentId: "a1",
  name: "Grampear quadro",
  unitTime: 1,
  description: "staple",
  qtyQuestion: "How many staples?",
};

const refilar: FactoryAction = {
  documentId: "a2",
  name: "Refilar madeira",
  unitTime: 10,
  description: "rip",
  qtyQuestion: "How many boards?",
};

describe("FactoryActionSearchField", () => {
  beforeEach(() => {
    searchFactoryActions.mockReset();
    searchFactoryActions.mockResolvedValue([grampear, refilar]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show suggestions when the field is not focused", () => {
    renderWithIntl(
      <FactoryActionSearchField
        id="action"
        value=""
        selectedName="Cortar compensado"
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Nenhuma ação encontrada.")).not.toBeInTheDocument();
  });

  it("shows empty state only while the field is focused", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    searchFactoryActions.mockResolvedValue([]);

    renderWithIntl(
      <FactoryActionSearchField
        id="action"
        value=""
        selectedName="Cortar compensado"
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Ação"));
    await vi.advanceTimersByTimeAsync(400);

    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(
      await screen.findByText("Nenhuma ação encontrada."),
    ).toBeInTheDocument();

    await user.tab();

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("clears the bound action id without wiping the query on backspace", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();

    renderWithIntl(
      <FactoryActionSearchField
        id="action"
        value="a1"
        selectedName="Cortar compensado"
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText("Ação");
    expect(input).toHaveValue("Cortar compensado");

    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(input).toHaveValue("Cortar compensad");
    expect(onChange).toHaveBeenCalledWith("", null);
  });

  it("selects a highlighted suggestion with arrow keys and Enter", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onChange = vi.fn();

    renderWithIntl(
      <FactoryActionSearchField
        id="action"
        value=""
        selectedName=""
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText("Ação"), "gra");
    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(searchFactoryActions).toHaveBeenCalledWith("gra");
    });
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("a2", refilar);
  });
});
