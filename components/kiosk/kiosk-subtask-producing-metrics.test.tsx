import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { KioskSubtaskProducingMetrics } from "./kiosk-subtask-producing-metrics";

describe("KioskSubtaskProducingMetrics", () => {
  it("shows expected time above the live elapsed counter", () => {
    renderWithIntl(
      <KioskSubtaskProducingMetrics
        startedAt="2026-06-05T10:00:00.000Z"
        timeSpent={0}
        expectedTime={120}
      />,
    );

    expect(screen.getByText(/Tempo previsto:/)).toBeInTheDocument();
    expect(screen.getByText("2min")).toBeInTheDocument();
    expect(screen.getByText(/Tempo decorrido:/)).toBeInTheDocument();
    expect(screen.getByText(/Início:/)).toBeInTheDocument();
  });
});
