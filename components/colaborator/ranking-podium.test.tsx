import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { RankingPodium } from "./ranking-podium";

describe("RankingPodium", () => {
  it("renders top rows and highlights the current user", () => {
    renderWithIntl(
      <RankingPodium
        currentUserDocumentId="u2"
        topRows={[
          { rank: 1, userDocumentId: "u1", name: "Ana", totalIncome: 200 },
          { rank: 2, userDocumentId: "u2", name: "Bruno", totalIncome: 150 },
          { rank: 3, userDocumentId: "u3", name: "Carla", totalIncome: 100 },
        ]}
      />,
    );

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByAltText(/1/i)).toBeInTheDocument();
    expect(screen.getByText("Bruno").closest("li")).toHaveClass("ring-2");
  });
});
