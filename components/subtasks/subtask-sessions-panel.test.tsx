import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { SubTaskSessionsPanel } from "./subtask-sessions-panel";

const sessions = [
  {
    colaboratorDocumentId: "u-1",
    colaboratorName: "Ana",
    startedAt: "2026-07-16T10:00:00.000Z",
    finishedAt: "2026-07-16T10:01:00.000Z",
    durationSec: 60,
    qty: 0,
  },
  {
    colaboratorDocumentId: "u-2",
    colaboratorName: "Bia",
    startedAt: "2026-07-16T10:00:00.000Z",
    finishedAt: "2026-07-16T10:01:00.000Z",
    durationSec: 60,
    qty: 0,
  },
];

const paymentCurrency = {
  iconUrl: "https://cdn.example/star.png",
  currencyPerSecond: 2,
  pluralTitle: "Estrelas",
};

describe("SubTaskSessionsPanel", () => {
  it("shows sessions above totals by default", () => {
    renderWithIntl(
      <SubTaskSessionsPanel sessions={sessions} sharingType="duration" />,
    );

    const sessionsHeading = screen.getByRole("heading", { name: "Histórico" });
    const totalsHeading = screen.getByRole("heading", {
      name: "Total por colaborador",
    });
    expect(
      sessionsHeading.compareDocumentPosition(totalsHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows totals above sessions when totalsFirst is set", () => {
    renderWithIntl(
      <SubTaskSessionsPanel
        sessions={sessions}
        sharingType="duration"
        totalsFirst
      />,
    );

    const sessionsHeading = screen.getByRole("heading", { name: "Histórico" });
    const totalsHeading = screen.getByRole("heading", {
      name: "Total por colaborador",
    });
    expect(
      totalsHeading.compareDocumentPosition(sessionsHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows name, earnings, participation and duration columns", () => {
    renderWithIntl(
      <SubTaskSessionsPanel
        sessions={sessions}
        sharingType="duration"
        expectedTime={60}
        timeSpent={120}
        paymentCurrency={paymentCurrency}
        totalsFirst
      />,
    );

    const totalsHeading = screen.getByRole("heading", {
      name: "Total por colaborador",
    });
    const table = totalsHeading.parentElement?.querySelector("table");
    expect(table).not.toBeNull();
    const totalsTable = within(table as HTMLTableElement);

    expect(totalsTable.getByText("Nome")).toBeInTheDocument();
    expect(totalsTable.getByText("Ganho")).toBeInTheDocument();
    expect(totalsTable.getByText("Participação")).toBeInTheDocument();
    expect(totalsTable.getByText("Duração")).toBeInTheDocument();

    expect(totalsTable.getByText("Ana")).toBeInTheDocument();
    expect(totalsTable.getAllByText("60").length).toBeGreaterThan(0);
    expect(totalsTable.getAllByText("50%").length).toBe(2);
    expect(totalsTable.getAllByText("1min").length).toBe(2);
  });

  it("stacks session date above time without a comma", () => {
    renderWithIntl(
      <SubTaskSessionsPanel
        sessions={[
          {
            colaboratorDocumentId: "u-1",
            colaboratorName: "Ana",
            startedAt: "2026-07-15T22:28:00.000Z",
            finishedAt: "2026-07-15T22:30:00.000Z",
            durationSec: 120,
            qty: 0,
          },
        ]}
        sharingType="duration"
      />,
    );

    expect(screen.queryByText(/,/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\d{2}\/\d{2}\/2026/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\d{2}:\d{2}/).length).toBeGreaterThan(0);
  });
});
