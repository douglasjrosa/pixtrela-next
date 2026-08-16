import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { TeamExchangePeriodLabel } from "./team-exchange-period-label";

describe("TeamExchangePeriodLabel", () => {
  it("renders padded day numbers with muted surrounding text", () => {
    renderWithIntl(<TeamExchangePeriodLabel firstDay={3} lastDay={15} />);

    expect(screen.getByText("Do dia")).toHaveClass("text-muted-foreground");
    expect(screen.getByText("ao dia")).toHaveClass("text-muted-foreground");
    expect(screen.getByText("03")).toHaveClass("font-semibold");
    expect(screen.getByText("15")).toHaveClass("font-semibold");
  });
});
