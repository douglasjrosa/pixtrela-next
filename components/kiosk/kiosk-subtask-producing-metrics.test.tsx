import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { formatDateTimePtBr } from "@/lib/format/datetime";
import { renderWithIntl } from "@/test/test-utils";

import { KioskProducingCardMetricsProvider } from "./kiosk-producing-card-metrics-provider";
import { KioskSubtaskProducingMetrics } from "./kiosk-subtask-producing-metrics";

describe("KioskSubtaskProducingMetrics", () => {
  it("shows metric labels and values on separate lines", () => {
    const startedAt = "2026-06-05T10:00:00.000Z";

    renderWithIntl(
      <KioskSubtaskProducingMetrics
        startedAt={startedAt}
        timeSpent={0}
        expectedTime={6032}
      />,
    );

    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(
      screen.getByText(formatDateTimePtBr(startedAt)),
    ).toBeInTheDocument();
    expect(screen.getByText("Tempo previsto")).toBeInTheDocument();
    expect(screen.getByText("1h 40m 32s")).toBeInTheDocument();
    expect(screen.getByText("Tempo decorrido")).toBeInTheDocument();
  });

  it("hides metrics turned off in settings", () => {
    renderWithIntl(
      <KioskProducingCardMetricsProvider
        value={{
          showStartedAt: false,
          showExpectedTime: true,
          showElapsed: false,
        }}
      >
        <KioskSubtaskProducingMetrics
          startedAt="2026-06-05T10:00:00.000Z"
          timeSpent={0}
          expectedTime={120}
        />
      </KioskProducingCardMetricsProvider>,
    );

    expect(screen.queryByText("Início")).not.toBeInTheDocument();
    expect(screen.getByText("Tempo previsto")).toBeInTheDocument();
    expect(screen.queryByText("Tempo decorrido")).not.toBeInTheDocument();
  });
});
