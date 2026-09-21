import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AppPageSkeleton,
  PAGE_LIST_SKELETON_ROW_COUNT,
} from "./app-page-skeleton";

describe("AppPageSkeleton", () => {
  it("announces the label and renders the default row count", () => {
    render(<AppPageSkeleton label="Carregando..." />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(document.querySelectorAll("li")).toHaveLength(
      PAGE_LIST_SKELETON_ROW_COUNT,
    );
  });
});
