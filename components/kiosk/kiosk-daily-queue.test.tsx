import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { KioskDailyQueue, type KioskSectionState } from "./kiosk-daily-queue";

const noop = () => undefined;

function unloadedSection(): KioskSectionState {
  return {
    producingUnits: [],
    units: [],
    nextCursor: null,
    hasMore: false,
    expanded: false,
    loading: false,
    loadedOnce: false,
  };
}

function emptyLiberadas(): KioskSectionState {
  return {
    producingUnits: [],
    units: [],
    nextCursor: null,
    hasMore: false,
    expanded: true,
    loading: false,
    loadedOnce: true,
  };
}

describe("KioskDailyQueue", () => {
  it("shows the empty notice inside Liberadas and keeps the other sections", () => {
    renderWithIntl(
      <KioskDailyQueue
        colaboratorId="u1"
        allSubTasks={[]}
        liberadas={emptyLiberadas()}
        bloqueadas={unloadedSection()}
        finalizadas={unloadedSection()}
        onLoadMoreLiberadas={noop}
        onToggleBloqueadas={noop}
        onLoadMoreBloqueadas={noop}
        onToggleFinalizadas={noop}
        onLoadMoreFinalizadas={noop}
      />,
    );

    const liberadas = screen.getByRole("region", { name: "Liberadas" });
    expect(within(liberadas).getByRole("status")).toHaveTextContent(
      "Nenhuma subtarefa atribuída.",
    );
    expect(screen.getByRole("button", { name: "Bloqueadas" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Concluídas hoje" }),
    ).toBeInTheDocument();
  });
});
