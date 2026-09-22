import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { ActivityEditProvider } from "./activity-edit-context";
import { ActivityListRowPresentational } from "./activity-list-row-presentational";
import type { ActivityRow } from "./types";

const ACTIVITY: ActivityRow = {
  documentId: "act-1",
  action: "stoped",
  timestamp: "2026-08-09T13:00:00.000Z",
  qty: 3,
  active: true,
  currencyAwarded: 42,
  colaboratorId: "u1",
  colaboratorName: "Ana",
  colaboratorCode: 1111,
  subTaskId: "st1",
  subTaskName: "Corte",
  taskName: "Caixa",
  taskQty: 1,
  taskCrmItemKey: null,
  taskDeliveryDate: null,
};

const LABELS = {
  inactive: "Arquivada",
  started: "Iniciada",
  stoped: "Parada",
  selectRow: "Selecionar Ana",
};

describe("ActivityListRowPresentational", () => {
  it("shows the earned currency amount in the table row", () => {
    renderWithIntl(
      <ActivityEditProvider onEdit={() => undefined}>
        <table>
          <tbody>
            <ActivityListRowPresentational
              activity={ACTIVITY}
              variant="table"
              labels={LABELS}
            />
          </tbody>
        </table>
      </ActivityEditProvider>,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
