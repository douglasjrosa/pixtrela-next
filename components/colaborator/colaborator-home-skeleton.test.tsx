import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColaboratorHomeSkeleton } from "./colaborator-home-skeleton";

describe("ColaboratorHomeSkeleton", () => {
  it("announces the label", () => {
    render(<ColaboratorHomeSkeleton label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
