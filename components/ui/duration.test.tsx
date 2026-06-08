import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { Duration } from "./duration";

describe("Duration", () => {
  it("renders hours and minutes from seconds", () => {
    renderWithIntl(<Duration seconds={5400} />);
    expect(screen.getByText("1h 30min")).toBeInTheDocument();
  });

  it("rounds up to the next minute", () => {
    renderWithIntl(<Duration seconds={61} />);
    expect(screen.getByText("2min")).toBeInTheDocument();
  });
});
