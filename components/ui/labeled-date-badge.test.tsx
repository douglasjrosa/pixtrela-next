import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import {
  LabeledDateBadge,
  labeledDateBadgeToneClassName,
} from "./labeled-date-badge";

describe("labeledDateBadgeToneClassName", () => {
  it("maps tones to badge classes", () => {
    expect(labeledDateBadgeToneClassName("danger")).toContain("destructive");
    expect(labeledDateBadgeToneClassName("secondary")).toContain("secondary");
  });
});

describe("LabeledDateBadge", () => {
  it("renders label above a date-only value", () => {
    renderWithIntl(
      <LabeledDateBadge label="Previsão" value="2026-07-17" tone="danger" />,
    );

    expect(screen.getByText("Previsão")).toBeInTheDocument();
    expect(screen.getByText("17/07/2026")).toBeInTheDocument();
    expect(screen.getByText("Previsão").parentElement?.className).toContain(
      "destructive",
    );
  });

  it("renders stacked date and time when showTime is true", () => {
    renderWithIntl(
      <LabeledDateBadge
        label="Conclusão"
        value="2026-07-17T15:30:00.000Z"
        tone="secondary"
        showTime
      />,
    );

    expect(screen.getByText("Conclusão")).toBeInTheDocument();
    const { date, time } = (() => {
      const date = new Date("2026-07-17T15:30:00.000Z");
      return {
        date: date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })();
    expect(screen.getByText(date)).toBeInTheDocument();
    expect(screen.getByText(time)).toBeInTheDocument();
    expect(screen.getByText("Conclusão").parentElement?.className).toContain(
      "secondary",
    );
  });

  it("renders nothing when value is missing", () => {
    const { container } = renderWithIntl(
      <LabeledDateBadge label="Conclusão" value={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
