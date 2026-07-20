import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TimeMetrics } from "./time-metrics";

describe("TimeMetrics", () => {
  it("shows estimated, spent and gained time with hover labels", () => {
    renderWithIntl(<TimeMetrics expectedTime={120} timeSpent={60} />);

    expect(screen.getByLabelText(/Tempo estimado/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tempo gasto/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tempo ganho/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tempo ganho/).className).toContain(
      "text-success",
    );
  });

  it("marks overtime as lost time in danger color", () => {
    renderWithIntl(<TimeMetrics expectedTime={60} timeSpent={120} />);

    const lost = screen.getByLabelText(/Tempo perdido/);
    expect(lost).toBeInTheDocument();
    expect(lost.className).toContain("text-destructive");
  });
});
