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
