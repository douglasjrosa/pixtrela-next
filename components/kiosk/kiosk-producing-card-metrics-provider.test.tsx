import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  KioskProducingCardMetricsProvider,
  useProducingCardMetricsVisibility,
} from "./kiosk-producing-card-metrics-provider";

function Probe() {
  const visibility = useProducingCardMetricsVisibility();
  return (
    <span>
      {visibility.showStartedAt ? "start-on" : "start-off"}{" "}
      {visibility.showExpectedTime ? "expected-on" : "expected-off"}{" "}
      {visibility.showElapsed ? "elapsed-on" : "elapsed-off"}
    </span>
  );
}

describe("KioskProducingCardMetricsProvider", () => {
  it("defaults to showing all metrics outside a provider", () => {
    render(<Probe />);
    expect(
      screen.getByText("start-on expected-on elapsed-on"),
    ).toBeInTheDocument();
  });

  it("exposes hidden flags to descendants", () => {
    render(
      <KioskProducingCardMetricsProvider
        value={{
          showStartedAt: false,
          showExpectedTime: true,
          showElapsed: false,
        }}
      >
        <Probe />
      </KioskProducingCardMetricsProvider>,
    );
    expect(
      screen.getByText("start-off expected-on elapsed-off"),
    ).toBeInTheDocument();
  });
});
