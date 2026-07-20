import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ColaboratorSurface } from "./colaborator-surface";

describe("ColaboratorSurface", () => {
  it("renders children inside the colaborator surface wrapper", () => {
    render(
      <ColaboratorSurface>
        <span>Home content</span>
      </ColaboratorSurface>,
    );

    expect(screen.getByText("Home content")).toBeInTheDocument();
    expect(screen.getByText("Home content").parentElement).toHaveClass(
      "colaborator-surface",
    );
  });
});
