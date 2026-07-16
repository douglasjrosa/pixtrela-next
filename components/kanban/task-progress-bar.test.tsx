import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TaskProgressBar } from "./task-progress-bar";

const NOW_MS = Date.parse("2026-07-16T12:00:00.000Z");

describe("TaskProgressBar", () => {
  it("renders spent and remaining around a marked track", () => {
    renderWithIntl(
      <TaskProgressBar
        totalTimeSpent={1800}
        totalExpectedTime={3600}
        nowMs={NOW_MS}
        progressInput={{
          subTasks: [
            { status: "producing", expectedTime: 3600, timeSpent: 1800 },
          ],
          openActivityStartedAts: [],
        }}
      />,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getAllByText("30min")).toHaveLength(2);
  });

  it("hides when expected time is zero", () => {
    const { container } = renderWithIntl(
      <TaskProgressBar
        totalTimeSpent={100}
        totalExpectedTime={0}
        nowMs={NOW_MS}
        progressInput={{ subTasks: [], openActivityStartedAts: [] }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows negative remaining from live open activities", () => {
    renderWithIntl(
      <TaskProgressBar
        totalTimeSpent={4000}
        totalExpectedTime={3600}
        nowMs={NOW_MS}
        progressInput={{
          subTasks: [
            { status: "producing", expectedTime: 3600, timeSpent: 3500 },
          ],
          openActivityStartedAts: ["2026-07-16T11:50:00.000Z"],
        }}
      />,
    );

    // liveSpent = 4000 + 600 = 4600s => 1h 17min
    // remaining = 3600 - 3500 - 600 = -500s => -9min (ceil)
    expect(screen.getByText("1h 17min")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "-9min"),
    ).toBeInTheDocument();
  });
});
